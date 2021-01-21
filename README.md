# HyperSec

HyperSec is a research project to provide Visual Analytics for blockchain security monitoring.
A publication is currently being prepared and will be linked here once it is available. A demo of the prototype is available at https://pcrw00123.ur.de:8080/ (user: exploreradmin, pass: exploreradminpw).

![](client/src/static/images/logo_small.png)

## Summary
The prototype in this repository is based on [Hyperledger Explorer](https://github.com/hyperledger/blockchain-explorer).
It is intended for security monitoring and includes several visualizations to facilitate this.

Key technical improvements compared to Hyperledger Explorer include:

- **Dashboard**: Fabric JIRA issues are shown on the dashboard
- **Network**: The network structure (peers, orderers) is visualized in the network view. Docker Logs can be inspected from the frontend
- **Blocks**: Blocks display is more compact, transaction detail inspection was moved to the block modal
- **Transactions**: Prometheus Operations Service Metrics are displayed in interactive charts. Transaction display is enhanced with user and size information
- **Chaincodes**: Security scan results can be inserted in the database and viewed in the frontend (use [revive-cc](https://github.com/sigma67/revive-cc) for scans)



# Setup

HyperSec requires some additional setup compared to a regular Hyperledger Explorer instance. Details are below.

## Hyperledger Fabric Configuration

Make sure to configure logging output as JSON. You also need to configure the Operations service. The required variables for both are shown below for a peer:

```
FABRIC_LOGGING_FORMAT=json
CORE_OPERATIONS_LISTENADDRESS=peer0.org1.example.com:9443
CORE_METRICS_PROVIDER=prometheus
```

An example yaml file is available [here](https://github.com/sigma67/fabric-samples/blob/metrics/test-network/docker/docker-compose-test-net.yaml).


If you want to use a pre-configured test network, you can use this repo for a correctly configured test network:

https://github.com/sigma67/fabric-samples (metrics branch)

## Hyperledger Explorer
Please refer to the base project Hyperledger Explorer for how to set up Hyperledger Explorer with your Hyperledger Fabric instance: https://github.com/sigma67/hypersec/tree/master

*Additional config*: You must set the proxy parameter in package.json to point to your Hyperledger Explorer Backend. `localhost:8080` works fine if the client is running on the same host.
In your `app\explorerconfig.json`, set the JIRA username and password (your Linux Foundation credentials) to see Hyperledger Fabric issues on the dashboard.

## Prometheus
A Prometheus instance is required and must be connected to a peer and an orderer.

An example config is available here:

https://github.com/sigma67/fabric-samples/blob/metrics/test-network/prometheus.yml

# License

Like the Hyperledger Explorer Project source code HyperSec is released under the Apache 2.0 license. The README.md, CONTRIBUTING.md files, and files in the "images", "__snapshots__" folders are licensed under the Creative Commons Attribution 4.0 International License. You may obtain a copy of the license, titled CC-BY-4.0, at http://creativecommons.org/licenses/by/4.0/.
