import axios from 'axios';

const TICKETMASTER_BASE_URL = 'https://app.ticketmaster.com/discovery/v2';
const API_KEY = import.meta.env.VITE_TICKETMASTER_API_KEY;

export interface TicketmasterEvent {
  id: string;
  name: string;
  url: string;
  images: Array<{
    url: string;
    width: number;
    height: number;
    ratio: string;
  }>;
  dates: {
    start: {
      localDate: string;
      localTime: string;
      dateTime: string;
    };
    status: {
      code: string;
    };
  };
  priceRanges?: Array<{
    type: string;
    currency: string;
    min: number;
    max: number;
  }>;
  venues?: Array<{
    name: string;
    city: {
      name: string;
    };
    state: {
      name: string;
      stateCode: string;
    };
    country: {
      name: string;
      countryCode: string;
    };
    address: {
      line1: string;
    };
    location: {
      latitude: string;
      longitude: string;
    };
  }>;
  classifications?: Array<{
    segment: {
      name: string;
    };
    genre: {
      name: string;
    };
    subGenre: {
      name: string;
    };
  }>;
}

export interface SearchParams {
  keyword?: string;
  city?: string;
  startDateTime?: string;
  endDateTime?: string;
  radius?: number;
  unit?: 'miles' | 'km';
  size?: number;
  page?: number;
  sort?: 'date,asc' | 'date,desc' | 'relevance,asc' | 'relevance,desc';
  classificationName?: string;
}

export interface SearchResponse {
  _embedded: {
    events: TicketmasterEvent[];
  };
  page: {
    size: number;
    totalElements: number;
    totalPages: number;
    number: number;
  };
}

class TicketmasterService {
  private readonly baseURL: string;
  private readonly apiKey: string;

  constructor() {
    this.baseURL = TICKETMASTER_BASE_URL;
    this.apiKey = API_KEY;

    if (!this.apiKey) {
      throw new Error('Ticketmaster API key is not configured');
    }
  }

  /**
   * Search for events using various criteria
   */
  async searchEvents(params: SearchParams): Promise<SearchResponse> {
    try {
      const response = await axios.get(`${this.baseURL}/events`, {
        params: {
          apikey: this.apiKey,
          ...params,
          locale: '*',
        },
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(`Ticketmaster API error: ${error.response.data.detail || error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get detailed information about a specific event
   */
  async getEventDetails(eventId: string): Promise<TicketmasterEvent> {
    try {
      const response = await axios.get(`${this.baseURL}/events/${eventId}`, {
        params: {
          apikey: this.apiKey,
        },
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(`Failed to fetch event details: ${error.response.data.detail || error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get event images in different sizes and formats
   */
  getEventImages(event: TicketmasterEvent) {
    const images = event.images || [];
    return {
      thumbnail: images.find(img => img.ratio === '4_3' && img.width <= 305)?.url,
      small: images.find(img => img.ratio === '16_9' && img.width <= 640)?.url,
      medium: images.find(img => img.ratio === '16_9' && img.width <= 1024)?.url,
      large: images.find(img => img.ratio === '16_9' && img.width >= 1024)?.url,
      hero: images.find(img => img.ratio === '16_9' && img.width >= 2048)?.url,
    };
  }

  /**
   * Format event data for display
   */
  formatEventData(event: TicketmasterEvent) {
    const venue = event.venues?.[0];
    const classification = event.classifications?.[0];
    const images = this.getEventImages(event);

    return {
      id: event.id,
      name: event.name,
      date: event.dates.start.localDate,
      time: event.dates.start.localTime,
      venue: venue ? {
        name: venue.name,
        city: venue.city.name,
        state: venue.state.stateCode,
        address: venue.address.line1,
        location: {
          latitude: parseFloat(venue.location.latitude),
          longitude: parseFloat(venue.location.longitude),
        },
      } : null,
      category: {
        main: classification?.segment?.name,
        genre: classification?.genre?.name,
        subGenre: classification?.subGenre?.name,
      },
      priceRange: event.priceRanges?.[0] ? {
        min: event.priceRanges[0].min,
        max: event.priceRanges[0].max,
        currency: event.priceRanges[0].currency,
      } : null,
      images,
      url: event.url,
    };
  }
}

export const ticketmasterService = new TicketmasterService(); 