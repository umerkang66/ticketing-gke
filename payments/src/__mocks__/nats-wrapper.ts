// new.ts, and update.ts only care about "client" property
export const natsWrapper = {
  client: {
    // creating the mock function, to ensure that this is actually called
    publish: jest
      .fn()
      .mockImplementation(
        (subject: string, data: string, callback: () => void) => {
          // this function will be invoked
          callback();
        }
      ),
  },
};
