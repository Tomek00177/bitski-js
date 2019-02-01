import { AccessTokenProvider, AuthenticatedFetchSubprovider, BitskiEngine } from 'bitski-provider';
import { AuthProvider } from '../auth/auth-provider';
import { AuthenticatedCacheSubprovider } from '../subproviders/authenticated-cache';
import { IFrameSubprovider } from '../subproviders/iframe';

// Predicate to determine if the token provider is an AuthProvider
function isAuthProvider(object: any): object is AuthProvider {
  return (object as AuthProvider).getUser !== undefined;
}

export class BitskiBrowserEngine extends BitskiEngine {

  private networkName: string;
  private rpcUrl: string;
  private webBaseUrl: string;
  private tokenProvider: AccessTokenProvider;
  private clientId: string;

  constructor(clientId: string, tokenProvider: AccessTokenProvider, networkName?: string, webBaseUrl?: string, rpcUrl?: string, options?: any) {
    super(options);
    this.networkName = networkName || 'mainnet';
    this.rpcUrl = rpcUrl || `https://api.bitski.com/v1/web3/${this.networkName}`;
    this.tokenProvider = tokenProvider;
    this.clientId = clientId;
    this.webBaseUrl = webBaseUrl || 'https://www.bitski.com';

    this.on('error', (error) => {
      if (error.message === 'Not signed in') {
        this.stop();
      }
    });

    this.addSubproviders();
  }

  protected addSubproviders() {
    const fetchSubprovider = new AuthenticatedFetchSubprovider(
      this.rpcUrl,
      false,
      this.tokenProvider,
      {'X-API-KEY': this.clientId, 'X-CLIENT-ID': this.clientId},
    );

    // Respond to some requests via userinfo object if available
    if (isAuthProvider(this.tokenProvider)) {
      const cacheSubprovider = new AuthenticatedCacheSubprovider(this.tokenProvider);
      this.addProvider(cacheSubprovider);
    }

    // Respond to requests that need approval with an iframe
    const iframeSubprovider = new IFrameSubprovider(this.webBaseUrl, this.networkName, this.tokenProvider);
    this.addProvider(iframeSubprovider);

    // Finally, add our basic fetch provider
    this.addProvider(fetchSubprovider);
  }

}
