# Amateur Sports League Platform — Complete Project Specification

## 1. What Is the Project?

This project is a complete digital platform for managing amateur sports leagues in Palestine.

The basic idea is simple:

Any person should be able to open the application, create a team, join an organized league, and let the platform handle the complicated parts:

* Finding opponents
* Organizing matches
* Scheduling matches
* Booking sports fields
* Assigning venues
* Managing match schedules
* Recording results
* Calculating standings
* Tracking player statistics
* Sending notifications
* Managing payments
* Managing teams and players

Instead of the current chaos:

> "Where are we playing on Friday?"

WhatsApp groups, phone calls, manually created Excel spreadsheets, missing players, last-minute cancellations, and manually calculated standings are replaced by one organized system.

The user should be able to open the app and see:

> "My team is registered in the league. Our next match is Friday at 8:00 PM. The venue is confirmed. The opponent is confirmed. I only need to show up."

The platform should make amateur sports organization simple.

---

# 2. The Problem We Are Solving

Currently, organizing an amateur match or league in Palestine involves many disconnected steps:

1. Finding an opponent through WhatsApp.
2. Calling friends and players.
3. Searching for an available field.
4. Agreeing on a time.
5. Collecting money manually.
6. Creating a schedule manually in Excel.
7. Calculating league standings manually.
8. Recording match results.
9. Finding missing players at the last minute.
10. Rescheduling matches when something unexpected happens.
11. Communicating schedule changes through multiple WhatsApp groups.
12. Tracking payments manually.
13. Managing player statistics manually.

Everything is fragmented, time-consuming, and difficult to manage.

The platform turns the entire process into one centralized system.

---

# 3. Long-Term Vision

The initial launch should be small.

Start with:

* One city: Jenin
* One sport: 7-a-side football
* A limited number of teams
* A limited number of venues

The goal is to validate the concept before expanding.

After proving the model in Jenin, expand to other Palestinian cities such as:

* Nablus
* Ramallah
* Hebron
* Bethlehem
* Other cities

Later, the platform should be capable of expanding internationally into markets such as:

* Jordan
* Turkey
* Gulf countries
* Other countries

However, the technical architecture must NOT be designed only for Jenin or only for 7v7 football.

The system must be flexible and configuration-driven from the beginning.

---

# 4. Critical Requirement: Everything Must Be Flexible

Do NOT hardcode assumptions such as:

* Exactly 7 players per team
* Exactly 8 teams per league
* Exactly 7 matches
* Exactly 125 ILS weekly payment
* Exactly 200 ILS deposit
* Exactly 10 ILS player fee
* Exactly 90-minute matches
* Exactly one sport
* Exactly one city
* Exactly one country
* Exactly one currency
* Exactly one language
* Exactly one league format

These are examples for the initial Jenin launch, not permanent technical limitations.

## Team Size Must Be Configurable

The system must support different team sizes.

Examples:

* 5v5
* 6v6
* 7v7
* 8v8
* 9v9
* 10v10
* 11v11

And for other sports:

* Basketball: configurable roster size
* Volleyball: configurable roster size
* Tennis: singles or doubles
* Table tennis: singles or doubles
* Badminton: singles or doubles
* Esports: configurable team size

The database and business logic must never assume that every team has 7 players.

A sport or competition should define its own rules and roster requirements.

For example:

```text
Sport
Competition Format
Minimum Roster Size
Maximum Roster Size
Players Required Per Match
Substitutes Allowed
Match Duration
Scoring System
League Format
```

All of these should be configurable.

---

# 5. League Size Must Be Flexible

Do NOT hardcode an 8-team league.

The platform must support different league sizes:

* 4 teams
* 5 teams
* 6 teams
* 8 teams
* 10 teams
* 12 teams
* 16 teams
* 20 teams
* etc.

The number of teams should be determined by the league configuration.

The scheduling system must automatically adapt to the number of registered teams.

For example:

```text
League A
Teams: 6

League B
Teams: 8

League C
Teams: 12
```

All three should work without changing the application code.

---

# 6. Players Per Team Must Be Flexible

The system must allow the administrator or league organizer to define:

* Minimum players required to register a team
* Maximum players allowed on a roster
* Maximum players allowed in a match
* Number of substitutes
* Whether a player can be registered to multiple teams
* Whether transfers are allowed
* Registration deadlines
* Roster lock dates

For example:

```text
7v7 League:
Minimum roster: 7
Maximum roster: 15
Match players: 7
Substitutes: 8
```

But another league could use completely different numbers.

Do not hardcode these values.

---

# 7. Users

There are four main user roles.

## 7.1 Player

The player is the primary user.

The player creates an account using:

* Name
* Profile photo
* City
* Age
* Preferred position
* Preferred foot
* Skill level

The player receives a sports profile showing statistics such as:

* Matches played
* Goals
* Assists
* Cards
* Overall rating
* City ranking
* Position ranking
* Awards
* Team history

This profile becomes the player's digital sports identity inside the platform.

The player should be able to share their profile with:

* Teams
* Captains
* Scouts
* Other players

---

# 8. Captain

The captain is also a player.

A captain receives all normal player permissions plus additional team-management permissions.

The captain can:

* Create a team
* Edit the team
* Add players
* Invite players
* Remove players
* Accept player applications
* Reject player applications
* Search for players
* Manage the team roster
* Confirm match results
* Request match rescheduling
* Manage the official league lineup
* View team statistics
* Manage team information

The system must support different team-management structures in the future.

Do not assume every team has only one captain.

The architecture should allow future support for:

* Multiple captains
* Team managers
* Coaches
* Assistant managers
* Custom team permissions

---

# 9. Venue / Field Owner

Venue owners have their own dashboard.

They can see:

* Upcoming bookings
* Booking history
* Revenue
* Peak hours
* Empty hours
* Available time slots
* Cancelled bookings
* Venue information

They can:

* Define available times
* Block unavailable times
* Confirm bookings
* Reject bookings
* Manage venue information
* View their financial information

Automatic venue booking is not required for the first version.

Initially, the admin can manually assign venues.

Automatic booking can be added later.

---

# 10. Admin

Initially, the platform administrator will manage the system.

The admin has full platform-management permissions.

The admin can:

* Create leagues
* Edit leagues
* Manage teams
* Manage players
* Manage venues
* Generate schedules
* Assign venues
* Confirm results
* Manage payments
* Track unpaid payments
* Send payment reminders
* Resolve disputes
* Manage users
* Suspend users
* Manage league settings
* Send announcements
* Send bulk notifications

The permission system should be designed so more administrative roles can be added later.

For example:

* Super Admin
* League Manager
* City Manager
* Referee Manager
* Finance Manager
* Support Manager

Do not hardcode the application around only one administrator.

---

# 11. Registration and Account Creation

The user opens the application.

They enter their phone number.

The system sends an OTP verification code.

After verification, the user completes their basic profile.

The user can connect an email address to their account.

If the user is new, they provide:

* City
* Preferred position
* Skill level
* Other relevant sports information

The initial skill rating is self-reported.

This is temporary.

Later, the platform should be able to calculate a more accurate rating based on actual performance.

For example:

* Match performance
* Goals
* Assists
* Wins
* Opponent strength
* League level
* Player statistics

The future rating system should be independent from the initial self-assessment.

---

# 12. Creating or Joining a Team

## Creating a Team

A player who wants to become a captain selects:

> Create Team

They enter:

* Team name
* Team logo
* Team level
* City
* Sport
* Other required team information

Initially, if the team does not upload a logo, the application can automatically create a simple logo using the first letter of the team name.

The captain receives an invitation link.

They can share the link through WhatsApp so their friends can join the team.

---

# 13. Finding a Team

A player without a team selects:

> Find a Team

The system shows teams looking for players.

Players can filter teams based on:

* City
* Sport
* Position
* Skill level
* Team availability
* Other relevant criteria

The player sends a join request.

The captain can:

* Accept
* Reject

The system should notify the player about the decision.

---

# 14. Finding Players

Captains can search for available players.

The search should support filters such as:

* City
* Position
* Skill level
* Age
* Preferred foot
* Availability
* Free Agent status
* Previous experience
* Player rating

This creates a local amateur player marketplace.

---

# 15. Joining a League

The captain can browse available leagues in their city.

Example:

> Jenin League — Season 1 — 8 Teams

But this is only an example.

The system must support any number of teams.

A league should display:

* League name
* Sport
* City
* Season
* Number of registered teams
* Maximum number of teams
* Number of available spots
* Number of matches
* Registration fee
* Payment structure
* Start date
* Expected end date
* Rules
* Venue information
* Prize information

The captain selects:

> Join League

The application shows a complete payment breakdown.

For example:

```text
Total team/player cost
Venue cost
Referee cost
Prize pool
Platform fee
Other fees
```

The exact amounts must be configurable.

Do not hardcode the example amounts.

---

# 16. Payment System

The payment system must fit the Palestinian market.

The initial version should NOT depend on complicated online payment gateways.

Supported payment methods should include:

* Cash
* Bank transfer
* WhatsApp coordination with the organizer
* Manual payment confirmation by the admin

The payment structure should be configurable.

For example, one league could use:

```text
Initial deposit: 200 ILS
Weekly payment: 125 ILS
```

Another league could use:

```text
Initial deposit: 300 ILS
Monthly payment: 250 ILS
```

Another could require:

```text
Full payment upfront
```

Therefore, the payment engine must support flexible:

* Deposits
* Installments
* Payment schedules
* Payment deadlines
* Partial payments
* Manual payment confirmation
* Payment reminders
* Late payments
* Outstanding balances
* Refunds
* Cancellations

A team is not officially activated in a league until the admin confirms the required payment.

---

# 17. League Scheduling

After the required number of teams is reached, the admin can generate the match schedule.

Initially, the admin can generate and adjust the schedule manually.

Later, the system can use an automated scheduling algorithm.

The scheduling system should consider:

* Number of teams
* Number of rounds
* Team availability
* Venue availability
* Match times
* Distance between teams and venues
* Previous match times
* Rest periods
* Venue capacity
* League format
* Competition rules
* Holidays
* Ramadan
* Local circumstances
* Rescheduled matches

The architecture must support multiple scheduling formats.

Examples:

* Single round robin
* Double round robin
* Group stage
* Knockout
* League + playoffs
* Custom formats

Do not build the scheduler around only one competition format.

---

# 18. Match Scheduling Must Be Flexible

Do not assume:

> 8 teams = 7 matches

That is only true for a specific single round-robin configuration.

The number of matches must be calculated from the league configuration.

The system should support:

* Different numbers of teams
* Different numbers of rounds
* Different match frequencies
* Different match durations
* Different time slots
* Different venues
* Different competition formats

Every match should contain information such as:

* Home team
* Away team
* Date
* Start time
* End time
* Venue
* Round
* Status
* Referee
* Result
* Match officials
* Rescheduling history

---

# 19. Match Day

The two teams arrive at the scheduled time.

The referee manages the match.

Initially, referees can be local university students receiving a small transportation allowance.

After the match, the captain or referee can record:

* Final score
* Goals
* Goal scorers
* Assists
* Cards
* Player of the Match
* Other sport-specific statistics

The result is submitted to the admin for confirmation.

Once confirmed, the system automatically updates:

* League standings
* Team statistics
* Player statistics
* Match history
* Player profiles
* Team profiles

---

# 20. Results and Standings

After a result is confirmed, the league table updates automatically.

For football, the system can show:

* Played
* Wins
* Draws
* Losses
* Goals for
* Goals against
* Goal difference
* Points

But do not hardcode football-specific standings into the entire platform.

The competition rules should determine which statistics are relevant.

Different sports have different ranking systems.

For example:

Football may use:

```text
Wins
Draws
Losses
Goals For
Goals Against
Goal Difference
Points
```

Basketball may use:

```text
Wins
Losses
Points For
Points Against
Point Difference
```

Tennis may use:

```text
Matches
Wins
Losses
Sets Won
Sets Lost
Games Won
Games Lost
```

The architecture must allow sport-specific statistics and ranking rules.

---

# 21. Player Statistics

After each confirmed match, player statistics should update automatically.

Examples:

* Matches played
* Goals
* Assists
* Cards
* Player of the Match awards
* Minutes played
* Clean sheets
* Other sport-specific statistics

The system should not assume every sport uses goals and assists.

Statistics should be configurable based on the sport.

---

# 22. Team Profiles

Each team should have a dedicated profile.

It should show:

* Team name
* Logo
* City
* Sport
* Current league
* Current season
* Players
* Captain
* Team statistics
* Match history
* Upcoming matches
* Results
* League position
* Achievements
* Trophies

The experience should feel similar to a professional sports game or FIFA-style club page.

---

# 23. Player Card

Each player should eventually have a digital player card inspired by FIFA-style sports cards.

The card can display:

* Player rating
* Position
* Key skills
* Statistics
* Matches
* Goals
* Assists
* Awards
* Team
* City ranking
* Position ranking

However, the exact attributes must depend on the sport.

For example, football could use:

* Pace
* Shooting
* Passing
* Dribbling
* Defending
* Physical

A different sport should use completely different attributes.

Do not hardcode football attributes into the player-card system.

---

# 24. Local Rankings

The platform should have a local ranking system.

Players can be ranked by:

* City
* Position
* Sport
* League
* Skill level

For example:

> #3 Best midfielder in Jenin

The ranking system should be designed so that a more advanced rating system can be added later.

The initial version can use simple statistics.

Later, it can support:

* ELO
* Performance ratings
* Opponent strength
* Match importance
* League level
* Advanced player analytics

---

# 25. Free Agent System

Players without teams should be able to activate:

> Free Agent

This allows them to advertise themselves to teams.

Their profile can show:

* Position
* Skill level
* City
* Availability
* Statistics
* Rating
* Previous teams
* Sports profile

Captains can search for free agents.

This creates a local talent marketplace.

---

# 26. Notifications

The system should send notifications for important events.

Examples:

* Upcoming match
* Match result
* Schedule change
* Venue change
* New team invitation
* Team join request
* Join request accepted
* Join request rejected
* Payment reminder
* Payment confirmation
* League announcement
* Match rescheduling
* League registration
* League starting soon

Notifications should support different channels in the future.

Examples:

* In-app notifications
* Push notifications
* WhatsApp
* Email
* SMS

The first version can focus on in-app and push notifications.

---

# 27. End of Season

At the end of the season:

* First-place team receives the championship trophy.
* Players receive medals.
* Top scorer receives an award.
* Other awards can be added.
* Season statistics are finalized.
* Photos can be published on social media.

The goal is to create memorable moments that naturally promote the next season.

---

# 28. MVP — Version 1

The first version should focus on the core experience.

## Player

* Sign up
* Login
* Phone OTP
* Create profile
* Edit profile
* Create team
* Invite players
* Search for teams
* Search for players
* Browse leagues
* Join leagues
* View matches
* View results
* View standings
* View player statistics
* Receive notifications

## Captain

Everything available to a player, plus:

* Manage team
* Add players
* Remove players
* Accept/reject players
* Confirm match result
* Request rescheduling
* Manage official roster
* View team statistics

## Admin

* Create league
* Edit league
* Manage teams
* Manage players
* Manage venues
* Generate schedule
* Assign venues
* Confirm results
* Manage payments
* Confirm payments
* Track unpaid balances
* Send payment reminders
* Manage users
* Resolve disputes
* Send announcements
* Send bulk notifications

## Venue Owner

* Venue dashboard
* View bookings
* View available times
* View revenue
* Confirm bookings
* Reject bookings
* Manage availability

---

# 29. Important Features After the MVP

The following features should be planned for the architecture but do NOT need to be built in Version 1:

* Automatic venue booking
* Live match tracking
* Live scores
* Advanced ELO rating
* Player marketplace
* Advanced talent marketplace
* Knockout tournaments
* Playoffs
* AI-powered scheduling
* Advanced analytics
* Multiple sports
* Multiple countries
* Multiple currencies
* Multiple languages
* International expansion
* Advanced referee management
* Sponsorship management
* Social media features
* Player transfers
* Team transfers
* Advanced scouting
* Advanced player performance analytics

Do not build these features now unless they are required for the MVP.

But design the architecture so adding them later does not require rebuilding the entire system.

---

# 30. Business Model

The platform should NOT depend on advertising as the primary revenue source.

Potential revenue streams include:

## Platform Fee

Example:

10 ILS per player per season.

For example:

8 teams × 10 players = 80 players

80 × 10 ILS = 800 ILS

This is only an example.

The fee must be configurable by:

* League
* Season
* Sport
* City
* Player
* Team

---

## Venue Booking Commission

Example:

A match venue costs 100 ILS.

The platform takes 10%.

Platform revenue:

10 ILS.

Again, this is only an example.

The commission percentage must be configurable.

---

## Venue PRO Subscription

Example:

199 ILS/month.

Venue owners receive advanced features such as:

* Advanced booking management
* Revenue analytics
* Availability management
* Customer management
* Reports

The exact price must be configurable.

---

## Tournament Fees

Example:

5–10 ILS per player.

The amount should be configurable.

---

## Sponsorships

Local companies can sponsor leagues.

Example:

> Coca-Cola Jenin League

The platform should eventually support sponsorship management.

Sponsors can receive:

* League branding
* Logo placement
* Social media exposure
* Match branding
* Tournament branding

---

# 31. Launch Strategy

The golden rule:

> Do not launch an empty application.

Start with:

* One city
* One sport
* A small number of teams
* A small number of venues

Initial target:

Jenin

Initial sport:

7v7 football

Initial venues:

Approximately 5–10 venues.

The first season is not primarily about profit.

The goal is to prove:

1. People are willing to create teams.
2. Players are willing to join.
3. Teams are willing to pay.
4. Players attend organized matches.
5. Venues are willing to participate.
6. The system actually reduces organizational problems.
7. Users return to the app every week.

Once the model works, expand gradually.

---

# 32. Initial Marketing Strategy

Do not depend heavily on paid advertising at the beginning.

Use direct local outreach.

Target:

* Players at football fields
* Team captains
* Popular local captains
* Venue owners
* University students
* Local sports communities

Use university students with skills in:

* Media
* Graphic design
* Video editing
* Social media

They can help with marketing in exchange for:

* Experience
* Portfolio work
* Recognition
* Participation in the project

---

# 33. Palestinian Market Requirements

This is a Palestinian product and the platform should feel Palestinian.

It should not feel like a translated foreign application.

The product should consider:

* Local language
* Local terminology
* Local team names
* Local venue names
* Palestinian cities
* Palestinian payment habits
* Cash payments
* Bank transfers
* Installments
* WhatsApp communication
* Ramadan
* Eid
* Local holidays
* Local schedules
* Local circumstances
* Unexpected security or logistical situations

The platform should be designed around the actual behavior of Palestinian amateur players.

The user should feel:

> "This app was made specifically for us."

Not:

> "This is a foreign app that was translated into Arabic."

---

# 34. Multi-Sport Architecture

Even though Version 1 starts with 7v7 football, the architecture must support multiple sports.

Potential sports include:

* Football
* Basketball
* Volleyball
* Tennis
* Table tennis
* Badminton
* Esports
* Other sports

Each sport should be able to define its own:

* Team size
* Roster size
* Match format
* Scoring system
* Statistics
* Player positions
* Player attributes
* Ranking system
* Match duration
* Substitution rules
* Competition format

Do not create separate hardcoded systems for every sport.

Build a flexible sports/competition engine.

---

# 35. Multi-Country Architecture

The first market is Palestine.

But the system should eventually support:

* Palestine
* Jordan
* Turkey
* Gulf countries
* Other countries

The architecture should therefore support:

* Countries
* Cities
* Currencies
* Languages
* Time zones
* Local date/time formats
* Local payment methods
* Local rules
* Local terminology

Do not hardcode Palestine-specific assumptions into the core business logic.

Palestinian-specific behavior should be configurable.

---

# 36. Multi-Currency Architecture

The initial currency is ILS.

But the platform should eventually support:

* ILS
* JOD
* TRY
* USD
* AED
* SAR
* Other currencies

Prices should not be stored as hardcoded strings such as:

> "200 ILS"

Instead, use proper monetary data structures.

For example:

```text
amount: 200
currency: ILS
```

---

# 37. Multi-Language Architecture

The initial interface can support Arabic and English.

The architecture should support additional languages later.

Do not hardcode UI text directly into components when localization is required.

Use a translation/localization system.

---

# 38. Database and Architecture Principles

Build the system as a real production-ready application.

Do not build a prototype that depends on hardcoded values.

Use a clean architecture with clear separation between:

* Users
* Profiles
* Teams
* Team members
* Sports
* Competitions
* Leagues
* Seasons
* Venues
* Matches
* Schedules
* Results
* Player statistics
* Team statistics
* Payments
* Notifications
* Rankings
* Awards
* Sponsorships
* Permissions
* Cities
* Countries
* Currencies

Relationships should be designed properly.

For example:

```text
Country
  └── City
       └── Venue

Sport
  └── Competition
       └── Season
            └── League
                 ├── Teams
                 ├── Matches
                 ├── Standings
                 └── Statistics
```

The exact database design is up to you, but it must support future growth.

---

# 39. Configuration Over Hardcoding

This is one of the most important requirements.

Whenever a value is expected to change between leagues, sports, cities, or seasons, it should be configurable.

Examples:

```text
team_size
minimum_roster_size
maximum_roster_size
players_per_match
substitutes_allowed
number_of_teams
number_of_rounds
match_duration
match_frequency
league_format
scoring_rules
ranking_rules
registration_fee
platform_fee
venue_fee
referee_fee
prize_pool
payment_schedule
currency
timezone
registration_deadline
season_start
season_end
```

An admin should eventually be able to create a league and configure these values without changing source code.

---

# 40. Do Not Overengineer Version 1

The MVP should remain simple.

Do not build:

* AI scheduling
* Complex recommendation algorithms
* Live match broadcasting
* Advanced ELO
* Complex social networking
* International payment systems
* Full marketplace infrastructure
* Advanced analytics

unless they are required.

Build the core workflow first:

```text
User
→ Profile
→ Team
→ League
→ Payment
→ Schedule
→ Match
→ Result
→ Standings
→ Statistics
→ Notifications
```

This is the core product loop.

---

# 41. The Main User Experience

The entire application should revolve around this simple journey:

```text
Create account
        ↓
Create or join a team
        ↓
Find a league
        ↓
Register
        ↓
Pay
        ↓
Get schedule
        ↓
Attend match
        ↓
Play
        ↓
Submit result
        ↓
Admin confirms result
        ↓
Standings update
        ↓
Player statistics update
        ↓
Next match notification
        ↓
Come back next week
```

This loop should be extremely easy to understand.

---

# 42. Technical Product Principle

Build the application so that the initial implementation can be small, but the underlying architecture can grow.

The application must be:

* Modular
* Maintainable
* Scalable
* Configuration-driven
* Secure
* Mobile-friendly
* Responsive
* Easy to extend
* Easy to localize
* Easy to add new sports to
* Easy to add new cities to
* Easy to add new countries to

Do not create technical debt by hardcoding the initial business assumptions.

---

# 43. Most Important Rule for Claude Code

When implementing this project, treat the numbers and examples in this document as INITIAL CONFIGURATION, not permanent limitations.

For example:

```text
7v7 is the initial football format.
8 teams is an example league size.
200 ILS is an example deposit.
125 ILS is an example installment.
10 ILS is an example platform fee.
5–10 venues is an initial launch target.
Jenin is the initial city.
Palestine is the initial market.
```

None of these should become hardcoded limitations in the codebase.

The system must allow an administrator to create:

```text
5v5 league
6 teams
10 players per roster
3 rounds
different payment structure
different currency
different venue rules
```

without modifying the application source code.

The same system should also be able to create:

```text
11v11 football league
16 teams
25-player rosters
double round-robin
different payment structure
```

without rewriting the core architecture.

The same principle applies to basketball, volleyball, tennis, badminton, table tennis, esports, and future sports.

---

# 44. Final Product Goal

The final product should become the operating system for amateur sports leagues in the region.

A player should not need:

* WhatsApp groups
* Excel spreadsheets
* Phone calls
* Manual calculations
* Searching for fields
* Searching for opponents
* Chasing teammates for payments

The platform should bring the entire experience together:

> Players + Teams + Leagues + Venues + Matches + Payments + Results + Rankings + Statistics + Notifications

The first version should prove the core concept in Jenin.

The architecture should prepare the product for everything that comes after Jenin.

Build the MVP first.

Keep the core architecture flexible.

Do not hardcode assumptions that belong to the initial launch configuration.
