import { OrderStatus } from '@ticketing-umer/common';
import mongoose from 'mongoose';
import { updateIfCurrentPlugin } from 'mongoose-update-if-current';

export { OrderStatus };

// This is not main model, but copied model from order service, so we have to add many properties that OrderDoc created, like id, and version
interface OrderAttrs {
  id: string;
  version: number;
  userId: string;
  price: number;
  status: OrderStatus;
}

interface OrderDoc extends mongoose.Document {
  version: number;
  userId: string;
  price: number;
  status: OrderStatus;
}

interface OrderModel extends mongoose.Model<OrderDoc> {
  build(attrs: OrderAttrs): OrderDoc;
  findByEvent(query: { id: string; version: number }): Promise<OrderDoc | null>;
}

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(OrderStatus),
    },
  },
  {
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
      },
    },
  }
);

orderSchema.set('versionKey', 'version');
orderSchema.plugin(updateIfCurrentPlugin);

orderSchema.statics.build = (attrs: OrderAttrs) => {
  return new Order({
    _id: attrs.id,
    version: attrs.version,
    price: attrs.price,
    userId: attrs.userId,
    status: attrs.status,
  });
};

orderSchema.statics.findByEvent = async (query: {
  id: string;
  version: number;
}): Promise<OrderDoc | null> => {
  // Currently we need to query by version, because we are not updating the order
  const order = await Order.findOne({
    _id: query.id,
    version: query.version - 1,
  });

  return order;
};

const Order = mongoose.model<OrderDoc, OrderModel>('orders', orderSchema);

export { Order };
