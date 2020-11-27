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

Now, let's step up to a higher level of test: functional tests.

You will use [Cucumber](https://cucumber.io) to write [BDD](https://en.wikipedia.org/wiki/Behavior-driven_development) tests using the NodeJS implementation [Cucumber-js](https://cucumber.io/docs/installation/javascript/).

This tool seperates the test specification in seperated `.feature` files. Those features can be written by non-dev people in your team, and goes in the direction of BDD for writing tests.

In this step, you will write a scenario that tests the paging on your `help-request` web api.

This will be a nice functional test testing if the API works as expected, including the connection to the database.

### Start your API with PostgreSQL

Before starting the Cucumber specification, you should start :
1. PostgreSQL used in the last workshop (with the data loaded):
  - launch the docker-compose from the `arlaide-database` project: `docker-compose up -d`
1. your web API **disabling** (for now) authentication on your `v1/help-request` route:
  - To do so, you just have to remove or comment the `jwtCheck` in the parameter of the route handler.

Make sure you can access help-requests on http://localhost:3000/v1/help-request?page=1&limit=15

### Cucumber

We prepared already necessary code under the `cucumber` folder of this repository.

Copy the whole `cucumber` folder at the root of your groupXX's repository.

Then, move to the cucumber folder, and install dependencies:
```sh
# From cucumber/ folder
nvm use
npm install
```

Then, have a look at the test inside the [cucumber/features](cucumber/features) folder:

```plain
# inside cucumber/features/help_requests.feature
Feature: Help Requests

    We want to query help requests page by page

    Scenario Outline: Query pages of different sizes
        Given <page> and <limit>
        When a User calls help request API
        Then the User should recieve <numberOfHelpRequests>

        Examples:
            | page | limit | numberOfHelpRequests |
            | 1    | 5     | 5                    |
            | 2    | 10    | 10                   |
            | 3    | 15    | 15                   |
```

This cucumber feature describes in a templated way how the help-request API should behave
when a user calls the API with different `page` and `limit` options.

Note that you are outside of the code of your web API, as opposed to your unit tests behing directly inside the code of your API.

Then, the corresponding step definitions:
```js
// inside cucumber/features/step_definitions/helpRequests.js
const assert = require("assert");
const fetch = require("node-fetch");
const { Given, When, Then } = require("@cucumber/cucumber");

Given("{int} and {int}", (page, limit) => {
  this.page = page;
  this.limit = limit;
});

When("a User calls help request API", async () => {
  const response = await fetch(
    `http://localhost:3000/v1/help-request?page=${this.page}&limit=${this.limit}`
  );
  const json = await response.json();
  this.apiResponse = json;
});

Then("the User should recieve {int}", (expectedNumberOfHelpRequests) => {
  if (this.apiResponse) {
    assert.strictEqual(this.apiResponse.length, expectedNumberOfHelpRequests);
  } else {
    assert.fail("no API response!");
  }
});
```
> Note: For simplicity, we kept the code in JavaScript, it is possible to use TypeScript but we
> think it is unecessary complexity for this workshop.

This code implements the corresponding behaviour of each steps define in the `.feature` file:
```plain
...
        Given <page> and <limit>
        When a User calls help request API
        Then the User should recieve <numberOfHelpRequests>
        
```
Where corresponding steps are linked with the same `Given`, `When` and `Then` message:
```js
// Given <page> and <limit>
Given("{int} and {int}", ...);

// a User calls help request API
When("a User calls help request API", ...);

// Then the User should recieve <numberOfHelpRequests>
Then("the User should recieve {int}", ...);
```


## Step 3: Implement e2e test with Cypress

## Step 4: Integrate test to your CD pipeline

