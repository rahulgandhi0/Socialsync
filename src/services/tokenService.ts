import { supabase } from '../lib/supabase';
import { encrypt, decrypt } from '../utils/encryption';

interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user_id: string;
}

class TokenService {
  private readonly TABLE_NAME = 'instagram_tokens';
  private readonly TOKEN_EXPIRY = 60 * 24 * 60 * 60 * 1000; // 60 days in milliseconds

  /**
   * Store encrypted tokens in Supabase
   */
  async storeTokens(userId: string, tokens: Partial<TokenData>): Promise<void> {
    try {
      const encryptedAccessToken = tokens.access_token ? encrypt(tokens.access_token) : null;
      const encryptedRefreshToken = tokens.refresh_token ? encrypt(tokens.refresh_token) : null;
      
      const { error } = await supabase
        .from(this.TABLE_NAME)
        .upsert({
          user_id: userId,
          access_token: encryptedAccessToken,
          refresh_token: encryptedRefreshToken,
          expires_at: tokens.expires_at || Date.now() + this.TOKEN_EXPIRY,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error storing tokens:', error);
      throw new Error('Failed to store Instagram tokens');
    }
  }

  /**
   * Retrieve and decrypt tokens from Supabase
   */
  async getTokens(userId: string): Promise<TokenData | null> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      if (!data) return null;

      return {
        access_token: data.access_token ? decrypt(data.access_token) : '',
        refresh_token: data.refresh_token ? decrypt(data.refresh_token) : '',
        expires_at: data.expires_at,
        user_id: data.user_id
      };
    } catch (error) {
      console.error('Error retrieving tokens:', error);
      throw new Error('Failed to retrieve Instagram tokens');
    }
  }

  /**
   * Check if tokens need refresh
   */
  async checkTokenExpiry(userId: string): Promise<boolean> {
    const tokens = await this.getTokens(userId);
    if (!tokens) return true;
    
    // Return true if token expires in less than 24 hours
    const expiryBuffer = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    return Date.now() + expiryBuffer >= tokens.expires_at;
  }

  /**
   * Delete tokens for a user
   */
  async deleteTokens(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(this.TABLE_NAME)
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting tokens:', error);
      throw new Error('Failed to delete Instagram tokens');
    }
  }
}

export const tokenService = new TokenService(); 