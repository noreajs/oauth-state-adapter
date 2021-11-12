import OauthStateEvent from "./OauthStateEvent";

export default interface IOauthStateData {
  type: OauthStateEvent;
  data: string | string[];
}
