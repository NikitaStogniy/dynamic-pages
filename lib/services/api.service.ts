export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ApiRequestConfig extends RequestInit {
  params?: Record<string, string>;
}

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  private buildUrl(endpoint: string, params?: Record<string, string>): string {
    const url = new URL(endpoint, window.location.origin);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }
    return url.toString();
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { error: 'An error occurred' };
      }
      throw new ApiError(
        errorData.error || `HTTP ${response.status}`,
        response.status,
        errorData
      );
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  private getHeaders(config?: ApiRequestConfig): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...config?.headers,
    };

    return headers;
  }

  async get<T>(endpoint: string, config?: ApiRequestConfig): Promise<T> {
    const url = this.buildUrl(endpoint, config?.params);
    const response = await fetch(url, {
      ...config,
      method: 'GET',
      headers: this.getHeaders(config),
      credentials: 'include', // Required for cookies
    });
    return this.handleResponse<T>(response);
  }

  async post<T>(endpoint: string, data?: any, config?: ApiRequestConfig): Promise<T> {
    const url = this.buildUrl(endpoint, config?.params);
    const response = await fetch(url, {
      ...config,
      method: 'POST',
      headers: this.getHeaders(config),
      credentials: 'include', // Required for cookies
      body: data ? JSON.stringify(data) : undefined,
    });
    return this.handleResponse<T>(response);
  }

  async put<T>(endpoint: string, data?: any, config?: ApiRequestConfig): Promise<T> {
    const url = this.buildUrl(endpoint, config?.params);
    const response = await fetch(url, {
      ...config,
      method: 'PUT',
      headers: this.getHeaders(config),
      credentials: 'include', // Required for cookies
      body: data ? JSON.stringify(data) : undefined,
    });
    return this.handleResponse<T>(response);
  }

  async delete<T>(endpoint: string, config?: ApiRequestConfig): Promise<T> {
    const url = this.buildUrl(endpoint, config?.params);
    const response = await fetch(url, {
      ...config,
      method: 'DELETE',
      headers: this.getHeaders(config),
      credentials: 'include', // Required for cookies
    });
    return this.handleResponse<T>(response);
  }

  async patch<T>(endpoint: string, data?: any, config?: ApiRequestConfig): Promise<T> {
    const url = this.buildUrl(endpoint, config?.params);
    const response = await fetch(url, {
      ...config,
      method: 'PATCH',
      headers: this.getHeaders(config),
      credentials: 'include', // Required for cookies
      body: data ? JSON.stringify(data) : undefined,
    });
    return this.handleResponse<T>(response);
  }
}

export const apiService = new ApiService();
export default ApiService;