import axios from 'axios';

const buildClient = ({ req }) => {
  if (typeof window === 'undefined') {
    // we are on the server
    // pre-configured version of axios
    // SERVICE_NAME.NAMESPACE.svc.cluster.local

    /*headers: {
      // ingress nginx has routing rules if only host is defined,
      Host: 'ticketing.dev',
    },*/

    // host, and cookies is also available on req.header

    return axios.create({
      // http://SERVICENAME.NAMESPACE.svc.cluster.local
      baseURL:
        'http://my-release-ingress-nginx-controller.default.svc.cluster.local',
      headers: req.headers,
    });
  } else {
    // we are on the client
    return axios.create({
      baseURL: '/',
    });
  }
};

export default buildClient;
