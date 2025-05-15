import { supabase } from '../lib/supabase';
import { ticketmasterService, TicketmasterEvent, SearchParams } from './ticketmaster';

interface CachedEvent {
  id: string;
  ticketmaster_data: TicketmasterEvent;
  cached_at: string;
  images: {
    thumbnail?: string;
    small?: string;
    medium?: string;
    large?: string;
    hero?: string;
  };
  formatted_data: ReturnType<typeof ticketmasterService.formatEventData>;
  interaction_count: number;
}

class EventDataService {
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private readonly CACHE_THRESHOLD = 5; // Number of interactions before caching

  /**
   * Search for events with selective caching
   */
  async searchEvents(params: SearchParams) {
    try {
      // Always get fresh search results from Ticketmaster
      const response = await ticketmasterService.searchEvents(params);
      const events = response._embedded.events;

      // Format events for display
      const formattedEvents = events.map(event => ticketmasterService.formatEventData(event));

      // In the background, check which events are frequently accessed
      this.updateEventCache(events).catch(console.error);

      return {
        events: formattedEvents,
        pagination: response.page,
      };
    } catch (error) {
      console.error('Error searching events:', error);
      throw error;
    }
  }

  /**
   * Get event details with smart caching
   */
  async getEventDetails(eventId: string) {
    try {
      // Check cache first
      const { data: cachedEvent } = await supabase
        .from('cached_events')
        .select('*')
        .eq('id', eventId)
        .single();

      // If cached and not expired, return cached data
      if (cachedEvent && this.isCacheValid(cachedEvent.cached_at)) {
        // Update interaction count in the background
        this.incrementInteractionCount(eventId).catch(console.error);
        return cachedEvent.formatted_data;
      }

      // Fetch fresh data from Ticketmaster
      const event = await ticketmasterService.getEventDetails(eventId);
      const formattedData = ticketmasterService.formatEventData(event);

      // Cache in background if this event has high interactions
      this.checkAndCacheEvent(event).catch(console.error);

      return formattedData;
    } catch (error) {
      console.error(`Error fetching event details for ${eventId}:`, error);
      throw error;
    }
  }

  /**
   * Update event cache based on interaction counts
   */
  private async updateEventCache(events: TicketmasterEvent[]) {
    try {
      // Get interaction counts for these events
      const { data: interactions } = await supabase
        .from('event_interactions')
        .select('event_id, count')
        .in('event_id', events.map(e => e.id))
        .group_by('event_id');

      // Cache events that meet the threshold
      const eventsToCache = events.filter(event => {
        const interactionCount = interactions?.find(i => i.event_id === event.id)?.count || 0;
        return interactionCount >= this.CACHE_THRESHOLD;
      });

      if (eventsToCache.length > 0) {
        await this.cacheEvents(eventsToCache);
      }
    } catch (error) {
      console.error('Error updating event cache:', error);
    }
  }

  /**
   * Increment interaction count for an event
   */
  private async incrementInteractionCount(eventId: string) {
    try {
      await supabase.rpc('increment_event_interaction_count', {
        event_id: eventId
      });
    } catch (error) {
      console.error('Error incrementing interaction count:', error);
    }
  }

  /**
   * Check if an event should be cached and cache it if necessary
   */
  private async checkAndCacheEvent(event: TicketmasterEvent) {
    try {
      const { data: interactionCount } = await supabase
        .from('event_interactions')
        .select('count')
        .eq('event_id', event.id)
        .single();

      if (interactionCount && interactionCount.count >= this.CACHE_THRESHOLD) {
        await this.cacheEvents([event]);
      }
    } catch (error) {
      console.error('Error checking event cache status:', error);
    }
  }

  /**
   * Cache events in Supabase
   */
  private async cacheEvents(events: TicketmasterEvent[]) {
    try {
      const cacheData = events.map(event => ({
        id: event.id,
        ticketmaster_data: event,
        cached_at: new Date().toISOString(),
        images: ticketmasterService.getEventImages(event),
        formatted_data: ticketmasterService.formatEventData(event),
        interaction_count: 0,
      }));

      const { error } = await supabase
        .from('cached_events')
        .upsert(cacheData, {
          onConflict: 'id',
        });

      if (error) {
        console.error('Error caching events:', error);
      }
    } catch (error) {
      console.error('Error in cacheEvents:', error);
    }
  }

  /**
   * Check if cached data is still valid
   */
  private isCacheValid(cachedAt: string): boolean {
    const cacheTime = new Date(cachedAt).getTime();
    const now = Date.now();
    return now - cacheTime < this.CACHE_DURATION;
  }

  /**
   * Get suggested events based on user preferences and history
   */
  async getSuggestedEvents(userId: string) {
    try {
      // Get user's event history and preferences
      const { data: userPreferences } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!userPreferences) {
        return this.searchEvents({ size: 10, sort: 'date,asc' });
      }

      // Build search params based on preferences
      const searchParams: SearchParams = {
        classificationName: userPreferences.preferred_categories?.join(','),
        city: userPreferences.preferred_location,
        radius: userPreferences.search_radius || 50,
        unit: 'miles',
        size: 10,
        sort: 'date,asc',
      };

      return this.searchEvents(searchParams);
    } catch (error) {
      console.error('Error getting suggested events:', error);
      throw error;
    }
  }

  /**
   * Save user event preferences
   */
  async saveUserPreferences(userId: string, preferences: {
    preferred_categories?: string[];
    preferred_location?: string;
    search_radius?: number;
  }) {
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error saving user preferences:', error);
      throw error;
    }
  }

  /**
   * Track event interaction
   */
  async trackEventInteraction(userId: string, eventId: string, interactionType: 'view' | 'save' | 'share') {
    try {
      const { error } = await supabase
        .from('event_interactions')
        .insert({
          user_id: userId,
          event_id: eventId,
          interaction_type: interactionType,
          created_at: new Date().toISOString(),
        });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error tracking event interaction:', error);
      throw error;
    }
  }
}

export const eventDataService = new EventDataService(); 