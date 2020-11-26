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
