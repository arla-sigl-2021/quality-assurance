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
