import cluster, { Worker } from "cluster";
import { cpus } from "os";
import {
    addState,
    getStates,
    removeState,
    setupOauthStateInstance,
    setupOauthStateMaster,
  } from "..";

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
   * Add a state that will be share with all worker
   */
  addState(state);

  setTimeout(() => {
    console.log(`states before deletion ${process.pid}`, getStates());
    /**
     * Remove state in all workers
     */
    removeState(state);
  }, Math.round(Math.random() * 50 * 1000));
}
