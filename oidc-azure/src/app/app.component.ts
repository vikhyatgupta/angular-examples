import { Component } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { OAuthService, AuthConfig, OAuthErrorEvent } from 'angular-oauth2-oidc';
import { SignatureValidationHandler } from './signature-validation-handler';

/* A private proxy server is required b/c ADFS and Azure AD do not support CORS */
export const PRIVATE_PROXY_SERVER: string = '<private proxy server>';
export const TENANT_GUID: string = '<enter guid here>';

export const authConfig: AuthConfig = {
  issuer: 'https://login.microsoftonline.com/' + TENANT_GUID + '/v2.0',
  redirectUri: window.location.origin + '/oidc-azure',
  requestAccessToken: false,
  showDebugInformation: true,
  clientId: '<enter client id here>',
  strictDiscoveryDocumentValidation: false
};

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent {
  
  raw = '';
  title = 'oidc-azure';

  constructor(private httpClient: HttpClient, private oauthService: OAuthService) {
    this.oauthService.configure(authConfig);
    this.oauthService.tokenValidationHandler = new SignatureValidationHandler();

    /*
    * From this url: https://login.microsoftonline.com/<enter domain name>/v2.0/.well-known/openid-configuration
    * you can find the loginUrl and tokenEndpoint
     */

     this.oauthService.loadDiscoveryDocument( 'https://' + PRIVATE_PROXY_SERVER + '/angular2azure/openid-configuration?tenant=' + TENANT_GUID ).then( doc => {
	    this.oauthService.tryLogin({
	    onTokenReceived: context => {
              console.debug("logged in");
              console.info( this.oauthService.getAccessToken() );
              console.info( this.oauthService.getIdToken() );
            }
         })
    });

    this.oauthService.responseType = 'id_token';
    this.oauthService.scope = 'openid email profile';

    this.oauthService.loginUrl = 'https://login.microsoftonline.com/' + TENANT_GUID + '/oauth2/v2.0/authorize';

    this.oauthService.events.subscribe(event => {
      if (event instanceof OAuthErrorEvent) {
        console.error(event);
      } else {
        console.warn(event);
      }
    });
  }

  login() {
    this.oauthService.initImplicitFlow();
  }

  logout() {
    this.oauthService.logOut();
  }

  get givenName() {
    const claims = this.oauthService.getIdentityClaims();
    if (!claims) {
      return null;
    }
    return claims['name'];
  }

  get_private() {

       var headers = new HttpHeaders({
		"Authorization": this.oauthService.getIdToken()
	});
	this.httpClient.get( 'https://' + PRIVATE_PROXY_SERVER + '/angular2azure/private?tenant=' + TENANT_GUID, { headers: headers } ).subscribe( (result) => {
		console.log( result );
		this.raw = JSON.stringify( result );
	});
    }
}
