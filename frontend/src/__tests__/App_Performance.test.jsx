import { render, waitFor } from '@testing-library/react';
import App from '../App';
import { Provider } from 'react-redux';
import store from '../store';
import axios from 'axios';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HelmetProvider } from 'react-helmet-async';

vi.mock('axios');

vi.mock('../component/Home/Home', () => ({
  default: () => <div>Mock Home</div>
}));

vi.mock('../component/layout/Header/Header', () => ({
  default: () => <header>Mock Header</header>
}));

describe('App Component Performance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    axios.get.mockResolvedValue({ data: { stripeApiKey: 'test_key' } });
  });

  it('should NOT fetch stripe API key on initial load, saving network bandwidth and server resources', async () => {
    render(
      <Provider store={store}>
        <HelmetProvider>
          <App />
        </HelmetProvider>
      </Provider>
    );

    // Wait a bit to ensure useEffect runs
    await waitFor(() => expect(axios.get).not.toHaveBeenCalledWith(expect.stringContaining('/stripeapikey')));
  });
});
