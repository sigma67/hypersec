## Requirements
revive-cc must be installed and accessible via CLI

https://github.com/sigma67/revive-cc

## Usage
Run the following line from `scanner` subdirectory:

```
node scan.js chaincode_name chaincode_dir
```

This scans all chaincode files in the directory chaincode_dir and adds the result to the chaincode chaincode_name in the Explorer database. The marbles chaincode is added in the `chaincode` subdirectory for testing purposes.