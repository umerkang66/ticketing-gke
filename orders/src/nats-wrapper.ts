import nats, { Stan } from 'node-nats-streaming';

// We are going to share the single instance, this is also known as Singleton, the class that is only initialized one time.
class NatsWrapper {
  private _client: Stan | undefined = undefined;

  public get client(): Stan {
    if (!this._client) {
      throw new Error(
        'Cannot access nats client before connecting to nats server'
      );
    }
    return this._client;
  }

  public connect(
    clusterId: string,
    clientId: string,
    url: string
  ): Promise<void> {
    this._client = nats.connect(clusterId, clientId, { url });

    return new Promise((resolve, reject) => {
      this.client.on('connect', () => {
        console.log('Connected to Nats');
        resolve();
      });

      this.client.on('error', reject);
    });
  }
}

export const natsWrapper = new NatsWrapper();
