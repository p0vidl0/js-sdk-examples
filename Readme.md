# Multiple query 0xPolygonID js-sdk examples

## Setup

1. Download the zk circuits into `./circuits` by running `dl_circuits.sh`. This will download the latest files from `https://iden3-circuits-bucket.s3.eu-west-1.amazonaws.com/latest.zip`

    ```bash
    ./dl_circuits.sh
    ```

2. Copy over the `.env.example` into `.env`  
  You'll need to fill in `RPC_URL` and `WALLET_KEY` with your own endpoint and key respectively. The default env vars assume you will be using the Polygon Amoy network.

    ```bash
    cp .env.example .env
    ```

    `example.env`

```bash
# reverse hash service url
RHS_URL="https://rhs-staging.polygonid.me"

# state v2 contract address in the amoy network
CONTRACT_ADDRESS="0x1a4cC30f2aA0377b0c3bc9848766D90cb4404124"

# RPC url
RPC_URL="https://rpc-amoy.polygon.technology"

```

3. Install dependencies

    ```bash
    npm i 
    ```

## Run

```bash
npm run multi-sd
```


## License

js-sdk-examples is part of the 0xPolygonID project copyright 2024 ZKID Labs AG

This project is licensed under either of

- [Apache License, Version 2.0](https://www.apache.org/licenses/LICENSE-2.0) ([`LICENSE-APACHE`](LICENSE-APACHE))
- [MIT license](https://opensource.org/licenses/MIT) ([`LICENSE-MIT`](LICENSE-MIT))

at your option.
