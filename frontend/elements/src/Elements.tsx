import { JSX, FunctionalComponent } from "preact";
import registerCustomElement from "@teamhanko/preact-custom-element";
import AppProvider, {
  ComponentName,
  GlobalOptions,
  HankoAuthMode,
} from "./contexts/AppProvider";
import { CookieSameSite, Hanko } from "@teamhanko/hanko-frontend-sdk";
import { defaultTranslations, Translations } from "./i18n/translations";
import { SessionTokenLocation } from "@teamhanko/hanko-frontend-sdk/dist/lib/client/HttpClient";

export interface HankoAuthAdditionalProps {
  prefilledEmail?: string;
  prefilledUsername?: string;
  mode?: HankoAuthMode;
}

export declare interface HankoAuthElementProps
  extends JSX.HTMLAttributes<HTMLElement>,
    HankoAuthAdditionalProps {}

export declare interface HankoProfileElementProps
  extends JSX.HTMLAttributes<HTMLElement> {}

export declare interface HankoEventsElementProps
  extends JSX.HTMLAttributes<HTMLElement> {}

declare global {
  // eslint-disable-next-line no-unused-vars
  namespace JSX {
    // eslint-disable-next-line no-unused-vars
    interface IntrinsicElements {
      "hanko-auth": HankoAuthElementProps;
      "hanko-login": HankoAuthElementProps;
      "hanko-registration": HankoAuthElementProps;
      "hanko-profile": HankoProfileElementProps;
      "hanko-events": HankoEventsElementProps;
    }
  }
}

// React 19 and later
declare module "react" {
  // eslint-disable-next-line no-unused-vars
  namespace JSX {
    // eslint-disable-next-line no-unused-vars
    interface IntrinsicElements {
      "hanko-auth": HankoAuthElementProps;
      "hanko-login": HankoAuthElementProps;
      "hanko-registration": HankoAuthElementProps;
      "hanko-profile": HankoProfileElementProps;
      "hanko-events": HankoEventsElementProps;
    }
  }
}

export interface RegisterOptions {
  shadow?: boolean;
  injectStyles?: boolean;
  enablePasskeys?: boolean;
  hidePasskeyButtonOnLogin?: boolean;
  translations?: Translations;
  translationsLocation?: string;
  fallbackLanguage?: string;
  storageKey?: string;
  cookieDomain?: string;
  cookieSameSite?: CookieSameSite;
  sessionCheckInterval?: number;
  sessionTokenLocation?: SessionTokenLocation;
}

export interface RegisterResult {
  hanko: Hanko;
}

interface InternalRegisterOptions extends RegisterOptions {
  tagName: string;
  entryComponent: FunctionalComponent<HankoAuthAdditionalProps>;
  observedAttributes: string[];
}

const globalOptions: GlobalOptions = {};

const createHankoComponent = (
  componentName: ComponentName,
  props: Record<string, any>,
) => {
  // In most browser the IDL property (script['nonce']) is the only way to access nonces.
  // Because of that the nonce would be an empty string in the props property.
  // https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/nonce
  const nonce = document
    .getElementsByTagName(`hanko-${componentName}`)
    // @ts-ignore
    .item(0)?.nonce;
  return (
    <AppProvider
      componentName={componentName}
      globalOptions={globalOptions}
      createWebauthnAbortSignal={createWebauthnAbortSignal}
      {...props}
      nonce={nonce}
    />
  );
};

const HankoAuth = (props: HankoAuthElementProps) => {
  return createHankoComponent("auth", props);
};

const HankoLogin = (props: HankoAuthElementProps) =>
  createHankoComponent("login", props);

const HankoRegistration = (props: HankoProfileElementProps) =>
  createHankoComponent("registration", props);

const HankoProfile = (props: HankoProfileElementProps) =>
  createHankoComponent("profile", props);

const HankoEvents = (props: HankoEventsElementProps) =>
  createHankoComponent("events", props);

let webauthnAbortController = new AbortController();

const createWebauthnAbortSignal = () => {
  if (webauthnAbortController) {
    webauthnAbortController.abort();
  }

  webauthnAbortController = new AbortController();
  return webauthnAbortController.signal;
};

const _register = async ({
  tagName,
  entryComponent,
  shadow = true,
  observedAttributes,
}: InternalRegisterOptions) => {
  if (!customElements.get(tagName)) {
    registerCustomElement(entryComponent, tagName, observedAttributes, {
      shadow,
    });
  }
};

export const register = async (
  api: string,
  options: RegisterOptions = {},
): Promise<RegisterResult> => {
  const observedAttributes = [
    "api",
    "lang",
    "prefilled-email",
    "entry",
    "mode",
  ];

  options = {
    shadow: true,
    injectStyles: true,
    enablePasskeys: true,
    hidePasskeyButtonOnLogin: false,
    translations: null,
    translationsLocation: "/i18n",
    fallbackLanguage: "en",
    storageKey: "hanko",
    sessionCheckInterval: 30000,
    ...options,
  };

  globalOptions.hanko = new Hanko(api, {
    cookieName: options.storageKey,
    cookieDomain: options.cookieDomain,
    cookieSameSite: options.cookieSameSite,
    localStorageKey: options.storageKey,
    sessionCheckInterval: options.sessionCheckInterval,
    sessionTokenLocation: options.sessionTokenLocation,
  });
  globalOptions.injectStyles = options.injectStyles;
  globalOptions.enablePasskeys = options.enablePasskeys;
  globalOptions.hidePasskeyButtonOnLogin = options.hidePasskeyButtonOnLogin;
  globalOptions.translations = options.translations || defaultTranslations;
  globalOptions.translationsLocation = options.translationsLocation;
  globalOptions.fallbackLanguage = options.fallbackLanguage;
  globalOptions.storageKey = options.storageKey;
  await Promise.all([
    _register({
      ...options,
      tagName: "hanko-auth",
      entryComponent: HankoAuth,
      observedAttributes,
    }),
    _register({
      ...options,
      tagName: "hanko-login",
      entryComponent: HankoLogin,
      observedAttributes,
    }),
    _register({
      ...options,
      tagName: "hanko-registration",
      entryComponent: HankoRegistration,
      observedAttributes,
    }),
    _register({
      ...options,
      tagName: "hanko-profile",
      entryComponent: HankoProfile,
      observedAttributes: observedAttributes.filter((attribute) =>
        ["api", "lang"].includes(attribute),
      ),
    }),
    _register({
      ...options,
      tagName: "hanko-events",
      entryComponent: HankoEvents,
      observedAttributes: [],
    }),
  ]);

  return { hanko: globalOptions.hanko };
};
