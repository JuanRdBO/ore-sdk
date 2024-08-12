# ORE SDK

A Typescript SDK to interface with the [ORE](https://github.com/regolith-labs/ore-cli) program.

## To install dependencies
```bash
bun install
```

## to test

```bash
bun test <testName>
```

## Features:

At the moment, only a subset of functionality is supported. PR's are welcome!

- [x] Fetch balances: Staked, ORE v1, ORE v2
- [x] Fetch bus addresses
- [x] Fetch rewards
- [x] Generate claim instruction
- [x] Generate open instruction
- [x] Generate close instruction
- [x] Generate stake instruction
- [x] Generate upgrade instruction
- [ ] Generate `Equihash` hashes
- [ ] Generate mine transaction