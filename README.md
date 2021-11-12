# Oauth state adapter

Create and share OAUTH state (authorization code, authorization code with PKCE and implicit grants) between workers.

> Issues are welcome event for grammar and vocabulary mistakes

### Why?

You have many workers run on the same port and all integrating oauth v2 connection.

Let's see the authorization code flow as example. A request for `authorization code` is send to the oauth server with a `state` that we generated on purpose for this request. When the oauth server send back a response with a code, the probability for the same worker to handle the request is almost zero.

We need a way to share `states` between workers so whatever the worker who receive the answer, we'll able to validate the request and get the token.

### Installation

Run the following command to install the package

```powershell
npm install oauth-state-adapter
```

### Available methods

#### setupOauthStateMaster

This function is mandatory to setup the oauth states management on the primary process. It doesn't have any parameter.

Function import

```javascript
import { setupOauthStateMaster } from "oauth-state-adapter";
```

Function prototype

```javascript
function setupOauthStateMaster(): void
```

#### setupOauthStateInstance

This function is mandatory to setup the oauth states management on the worker. It doesn't have any parameter.

Function import

```javascript
import { setupOauthStateInstance } from "oauth-state-adapter";
```

Function prototype

```javascript
function setupOauthStateInstance(): void
```

#### addState

This function can be anywhere in a worker to share a state between all workers.

Function import

```javascript
import { addState } from "oauth-state-adapter";
```

Function prototype

```javascript
function addState(state: string): void
```

#### removeState

This function can be anywhere in a worker to remove a state in all workers.

Function import

```javascript
import { removeState } from "oauth-state-adapter";
```

Function prototype

```javascript
function removeState(state: string): void
```

#### getStates

This function can be use anywhere in the app, both in primary process and workers. It return the list of states list.

Function import

```javascript
import { getStates } from "oauth-state-adapter";
```

Function prototype

```javascript
function getStates(): string[]
```

### Full example

This example illustrate how states are shared arround workers.

```typescript
import cluster, { Worker } from "cluster";
import { cpus } from "os";
import {
  addState,
  getStates,
  removeState,
  setupOauthStateInstance,
  setupOauthStateMaster,
} from "oauth-state-adapter";

const totalCPUs = cpus().length;

if (cluster.isPrimary) {
  console.log(`Number of CPUs is ${totalCPUs}`);
  console.log(`Master ${process.pid} is running`);

  /**
   * Setup oauth state on primary worker
   */
  setupOauthStateMaster();

  // Fork workers.
  for (let i = 0; i < totalCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker: Worker, code: any, signal: any) => {
    console.log(`worker ${worker.process.pid} died`);
    console.log("Let's fork another worker!");
    cluster.fork();
  });
} else {
  /**
   * Setup oauth state on worker
   */
  setupOauthStateInstance();

  const state = `worker:${process.pid}`;

  /**
   * Add a state that will be share with all workers
   */
  addState(state);

  /**
   * Remove the local state automatically after a random delay (0 - 50 seconds)
   */
  setTimeout(() => {
    console.log(`states before deletion ${process.pid}`, getStates());
    /**
     * Remove state in all workers
     */
    removeState(state);
  }, Math.round(Math.random() * 50 * 1000));
}
```

