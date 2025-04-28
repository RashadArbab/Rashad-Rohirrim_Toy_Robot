Hi, 

Thank you for giving me this challenge I hope you are happy with the results. I considered going above and beyond the requirements though I figured it best to build only the requirements and not over build. 
Thats an approach I have come to appreciate more as I matured as a developer, you dont always have all the answers and the bigger picture so when someone tells you the specs to build sometimes its best to just build exactly what is in the spec. I have also included some of my thoughts and decisions while building the app. 



## How to Run: 
 
    For context this repo includes bothe the frontend and backend, first you should open the backend npm install dependencies then
    run migrations, then turn on the server. Then move back out and into the frontend folder npm install the dependencies then turn on the frontend. 

    - cd backend
    - npm install  
    - npm run typeorm:generate -- src/migrations/initial_migration    # this will run migrations and setup the db.
    - npm run start           # this will start the backend server on port 3000 

    Open a second terminal window 
    - cd frontend 
    - npm install  
    - npm run dev # this will start the frontend server on port 5173 

    To access the frontend app once started open a browser and visit http://localhost:5173 

    In order to run the tests for the backend run 
    - cd backend 
    - npm run test 
    or for a verbose output of what is tested
    - npm run test:verbose



## General Thoughts on the build:

1. The reason for updating the db when the user uses rotate every time even before they click move is that if they rotate the robot then refresh the page I want persistence in the direction the robot is facing. 
One thing to watch out for though is that since this will entail an api call and a db update maybe I need to stop further button clicks or ensure that its fast enough that if someone spams arrow keys it doesnt break the system. 
After some testing I found that not to be an issue. 

1. I kept in the ability to expand the board size, this is a little bit of over building but I think its ok and it didnt take a lot of effort or time. 

2. I used react and redux for the frontend, I am comfortable with react and I didn't want to experiment with 2 new technologies at once. 
Redux often gets a bad rep for being bulky or taking too much effort though I prefer it to other state managment solutions as it just gets the job done and doesnt limit my actions or force me to code in a specific style. 

1. This is my first time using NestJS and I didn't struggle too much. Overall it was easy to understand the pattern of modules, controllers, and services I needed some help with syntax but nothing I couldnt get used to in say 1 week. 

2. For testing I put fairly thorough tests for each of the service functions, and for the controllers on the case they receive a bad input. 

3. I have the get history which is another sort of over built requirement. The spec says that as you place a robot in a new location the previous histories get wiped. 

4. For persistence through refresh's the state mangement should hold onto the data as well as the db, though if i wanted something that would hold on to it through closing the tab and server then starting again I would have a list of robots and
allow the user to choose which robot and table they want to return to. 



## Database Schema

The backend uses SQLite (via TypeORM) and defines two tables: `robot` and `robot_history`.  They are linked in a one-to-many relationship (one Robot → many history entries).

---

### `robot`

| Column      | Type       | Constraints                  | Description                                             |
| ----------- | ---------- | ---------------------------- | ------------------------------------------------------- |
| `id`        | UUID       | PRIMARY KEY                  | Unique identifier for each robot.                      |
| `x`         | INTEGER    | NOT NULL                     | Current X-coordinate on the board.                     |
| `y`         | INTEGER    | NOT NULL                     | Current Y-coordinate on the board.                     |
| `facing`    | TEXT       | NOT NULL, ENUM(`NORTH`, `EAST`, `SOUTH`, `WEST`) | Direction the robot is facing.           |
| `maxX`      | INTEGER    | NOT NULL, DEFAULT 4          | Maximum X value allowed (board width − 1).             |
| `maxY`      | INTEGER    | NOT NULL, DEFAULT 4          | Maximum Y value allowed (board height − 1).            |
| `createdAt` | DATETIME   | NOT NULL, auto-populated     | Timestamp when the robot record was created.           |
| `updatedAt` | DATETIME   | NOT NULL, auto-updated       | Timestamp when the robot record was last modified.     |

---

### `robot_history`

| Column      | Type     | Constraints                         | Description                                   |
| ----------- | -------- | ----------------------------------- | --------------------------------------------- |
| `id`        | UUID     | PRIMARY KEY                         | Unique identifier for each history entry.     |
| `robot_id`  | UUID     | NOT NULL, FOREIGN KEY → `robot(id)` | Reference to the parent robot.                |
| `x`         | INTEGER  | NOT NULL                            | X-coordinate snapshot at this history point.  |
| `y`         | INTEGER  | NOT NULL                            | Y-coordinate snapshot at this history point.  |
| `facing`    | TEXT     | NOT NULL, ENUM(`NORTH`, `EAST`, `SOUTH`, `WEST`) | Facing snapshot at this history point. |
| `timestamp` | DATETIME | NOT NULL, auto-populated            | When this history entry was recorded.         |

---

## Relationships

```text
┌─────────┐        1      *       ┌─────────────────┐
│  robot  │────────────────────>│  robot_history  │
└─────────┘   (robot.id)         └─────────────────┘
```
- **One Robot** can have **many** history entries.  
- On deletion of a `robot` record, all its `robot_history` entries are cascaded (deleted) automatically.

---

### Usage Notes

- **Initial placement** of a robot creates its first row in `robot_history`.  
- Subsequent **rotate** or **move** operations insert new rows into `robot_history` to track the full movement timeline.  
- The `/history/:id` endpoint returns the ordered array of history rows (sorted by `timestamp`) for replay or reporting purposes.  