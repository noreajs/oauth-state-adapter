import IOauthStateData from "./interfaces/IOauthStateData";
import cluster, { Worker } from "cluster";
import OauthStateEvent from "./interfaces/OauthStateEvent";

declare global {
  var OAUTH_STATES: string[];
}

export { IOauthStateData, OauthStateEvent };

/**
 * Send states to workers online
 * @param states states
 */
function sendStatesToWorkers(states: string[]) {
  try {
    // workers
    const workers = cluster.workers;

    if (workers) {
      for (const key of Object.keys(workers)) {
        const worker = workers[key];
        if (worker) {
          worker.send({
            type: OauthStateEvent.OAUTH_STATE_LIST,
            data: states,
          } as IOauthStateData);
        }
      }
    }
  } catch (error) {}
}

/**
 * Get states
 * @returns string[]
 */
export function getStates() {
  const states = global.OAUTH_STATES;
  if (states !== null && states !== undefined) {
    return states;
  } else {
    return [];
  }
}

/**
 * Add a state
 * @param state state
 */
export function addState(state: string) {
  process.send?.({
    type: OauthStateEvent.ADD_OAUTH_STATE,
    data: state,
  } as IOauthStateData);
}

/**
 * Remove a state
 * @param state state
 */
export function removeState(state: string) {
  process.send?.({
    type: OauthStateEvent.REMOVE_OAUTH_STATE,
    data: state,
  } as IOauthStateData);
}

/**
 * Setup oauth state on the master worker
 */
export function setupOauthStateMaster() {
  // listen to messages
  cluster.on("message", (_worker: Worker, payload: IOauthStateData) => {
    try {
      if (Object.keys(payload).includes("type")) {
        switch (payload.type) {
          case OauthStateEvent.ADD_OAUTH_STATE:
            {
              const states = getStates();
              if (Array.isArray(payload.data)) {
                states.push(...payload.data);
              } else {
                states.push(payload.data);
              }

              // update states
              global.OAUTH_STATES = states;

              // update states
              sendStatesToWorkers(states);
            }
            break;

          case OauthStateEvent.REMOVE_OAUTH_STATE:
            {
              let states = getStates();
              let targets = payload.data;
              if (Array.isArray(targets)) {
                for (const target of targets) {
                  for (const state of states) {
                    // state match
                    if (target === state) {
                      const firstElementIndex = states.findIndex(
                        (s) => s === state
                      );
                      // remove state
                      states = states.filter((_value, index) => {
                        return index !== firstElementIndex;
                      });

                      break;
                    }
                  }
                }
              } else {
                for (const state of states) {
                  // state match
                  if (targets === state) {
                    const firstElementIndex = states.findIndex(
                      (s) => s === state
                    );
                    // remove state
                    states = states.filter((_value, index) => {
                      return index !== firstElementIndex;
                    });

                    break;
                  }
                }

                // update states
                global.OAUTH_STATES = states;

                // update states
                sendStatesToWorkers(states);
              }
            }
            break;
        }
      }
    } catch (error) {
      console.log("setupOauthStateMaster error", error);
    }
  });

  // listen to worker creation
  cluster.on("fork", (worker: Worker) => {
    try {
      worker.send({
        type: OauthStateEvent.OAUTH_STATE_LIST,
        data: getStates(),
      } as IOauthStateData);
    } catch (error) {}
  });
}

/**
 * Setup oauth state on worker
 */
export function setupOauthStateInstance() {
  // listen to new message
  process.on("message", (payload: IOauthStateData) => {
    try {
      if (Object.keys(payload).includes("type")) {
        if (payload.type === OauthStateEvent.OAUTH_STATE_LIST) {
          if (Array.isArray(payload.data)) {
            global.OAUTH_STATES = payload.data;
          } else {
            global.OAUTH_STATES = [payload.data];
          }
        }
      }
    } catch (error) {}
  });
}
