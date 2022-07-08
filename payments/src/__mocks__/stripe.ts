export const stripe = {
  charges: {
    // this function should automatically resolve itself by empty obj
    create: jest.fn().mockResolvedValue({ id: 'test_id' }),
  },
};
