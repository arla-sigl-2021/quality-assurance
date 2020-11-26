# QA workshop

This workshop is made for EPITA SIGL 2021 students.

You will learn how to:
- implement unit test in node
- implement basic fonctional test
- implement e2e test using [Cypress.io](https://cypress.io)
- adapt your CD pipeline to execute tests on each release

## Step 1: Implement unit test

Let's create a unit test in your web-api. 

Your API is using a paging system based on 2 query parameters `page` and `limit`.
The logic is written inside the `src/utils.ts` package, in the function `extractPageOptions`.

You will write a set of unit test to make sure that the method works as expected.

### Install Jest

To implement unit tests, you will use a new node module called [Jest](https://jestjs.io).
> Note: You often encounter mainly two JavaScript testing frameworks: [Jest](https://jestjs.io) and [Mocha](https://mochajs.org).
> Those two tools serve same purpose, but we found that Jest offers a better development experience. This is important since developpers are often lazy to write tests!

To install Jest, install it like any other node modules (from your API project):
```sh
# From your api/ folder:

# make sure you have correct node version activated
nvm use
# install the jest module with a package to config jest with TypeScript
npm i --save-dev ts-jest jest @types/jest
# Create a default jest config
npx ts-jest config:init
# It should create a jest.config.js 
```

Now, let's add a new script inside your `package.json` file to run test using jest when typing `npm test`:
```json
// ...
  "scripts": {
    // "build": ...,
    // ...,
    "test": "jest --passWithNoTests"
  }
```

Now try to run test typing `npm test` or `npm t`. You should see the following output:
```log
> ...
> jest --passWithNoTests

No tests found, exiting with code 0
```

If you see this logs, it means you've correctly set Jest.

### Create coverage for `extractPageOptions`

Now that Jest is correctly set, let's create some unit test for `extractPageOptions`.

First, let's refactor the function to make it easier to test.

#### Refactor extractPageOptions to ease the writing of unit test

First, the `asNumber` method had a flaw (we actually noticed it by implementing a unit test!). 
Rewrite the `asNumber` function as follow:
```ts
// From api/src/utils.ts
// ...

// Try to cast to the query option to a number;
// throws an error otherwise
const asNumber = (query: qs.ParsedQs, optionName: string) => {
  const queryOption = query[optionName];
  const invalidFormatError = new Error(
    `${optionName} needs to be a valid number`
  );

  if (typeof queryOption === "string") {
    const n = +queryOption;
    if (isNaN(n)) throw invalidFormatError;
    return n;
  } else {
    throw invalidFormatError;
  }
};
```

The current implementation of `extractPageOptions` is taking the whole express Request object, which is too complex and cumbersome to create for a unit test.

Instead, you will refactor the `extractPageOptions` to directly take the `query` as parameter; which is only a dictionary:
```ts
// Inside api/src/utils.ts
//...
export const extractPageOptions = (
  query: qs.ParsedQs
) => {
    
    // ...
}
```

And replace the paramaters where `extractPageOptions` is used inside `api/src/server.ts`:
```ts
// Inside server.ts; where you had the former extractPageOptions
// ...
const { page, limit } = extractPageOptions(request.query);
// ...
```

#### Create unit tests

Let's first create a simple unit test to check the expected behaviour of the `extractPageOption` fuction.

Create a new file `api/src/utils.spec.ts` with:
```ts
import qs from "qs";
import { extractPageOptions } from "./utils";

describe("extractPageOptions", () => {
  
  it("should correctly extract page and limit options when present", () => {
    const validQuery: qs.ParsedQs = {
      page: "1",
      limit: "10"
    };
    const { page, limit } = extractPageOptions(validQuery);
    expect(page).toEqual(1);
    expect(limit).toEqual(10);
  });

}
```

Now run this test and make sure it's running without error:

```sh
# Both `npm t` and `npm test` are equivalent
npm test
# Output:
# > template-api@1.0.0 test ...
# > jest --passWithNoTests
# 
#  PASS  src/utils.spec.ts
#   extractPageOptions
#     ✓ should correctly extract page and limit options when present (3 ms)
# 
# Test Suites: 1 passed, 1 total
# Tests:       1 passed, 1 total
# Snapshots:   0 total
# Time:        1.911 s, estimated 2 s
# Ran all test suites.
```

Now, to make sure test is correctly implemented, let's make it fail on purpose.
Replace `expect(page).toEqual(1);` by `expect(page).toEqual(1000);`, and run `npm test` again.

You should see an error like:
```log

> template-api@1.0.0 test ...
> jest --passWithNoTests

 FAIL  src/utils.spec.ts
  extractPageOptions
    ✕ should correctly extract page and limit options when present (5 ms)

  ● extractPageOptions › should correctly extract page and limit options when present

    expect(received).toEqual(expected) // deep equality

    Expected: 1000
    Received: 1

      10 |     };
      11 |     const { page, limit } = extractPageOptions(validQuery);
    > 12 |     expect(page).toEqual(1000);
         |                  ^
      13 |     expect(limit).toEqual(10);
      14 |   });
      15 | 

      at Object.<anonymous> (src/utils.spec.ts:12:18)

Test Suites: 1 failed, 1 total
Tests:       1 failed, 1 total
Snapshots:   0 total
Time:        2.314 s
Ran all test suites.
npm ERR! Test failed.  See above for more details.
```

You can see that the test failed, as expected!

Revert changes to make it green again (`expect(page).toEqual(1);` instead of `expect(page).toEqual(1000);`)


Let's add new unit test to check if errors are correclty thrown when one of the option is missing:

```ts
  // inside describe() after the first it()  
  // ...
  it("should throw an error when page is missing", () => {
      const onlyLimit: qs.ParsedQs = {
          limit: "10"
      };
      expect(() => extractPageOptions(onlyLimit)).toThrowError(
        new Error("page needs to be a valid number")
      );
  });

  it("should throw an error when limit is missing", () => {
    const onlyPage: qs.ParsedQs = {
        page: "10"
    };
    expect(() => extractPageOptions(onlyPage)).toThrowError(
      new Error("limit needs to be a valid number")
    );
  });
  // ...
```

Now add a unit test to check if an error is thrown when a given option is not a valid number:

```ts
// ...
    it("should throw an error when page is not a number", () => {
      const invalidPageNaN = {
          page: "page1",
          limit: "10"
      }
      expect(() => extractPageOptions(invalidPageNaN)).toThrowError(
          new Error("page needs to be a valid number")
      )
// ...
});
```

Your turn to practice!

Try to implement a unit test to check that an error is thrown when the option page is a negative number:
```ts
    it("should throw an error when page is negative", () => {
        // TODO: your turn to practice!
    })
``` 

## Step 2: Implement functional test

Now, let's test if the help-request API is working as expected.

In this test, you will test the whole API, with the paging system.

You will create an API scenario where you will call several pages and expect the correct results.



## Step 3: Implement e2e test with Cypress

## Step 4: Integrate test to your CD pipeline

