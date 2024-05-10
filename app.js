const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const dbPath = path.join(__dirname, 'todoApplication.db')
const app = express()
app.use(express.json())
let db = null

const initializDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server is Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}
initializDBAndServer()

//Returns a list of all todos whose status is 'TO DO'
const statusAndpriorityCheck = requestQuery => {
  return (
    requestQuery.status !== undefined && requestQuery.priority !== undefined
  )
}
const statusCheck = requestQuery => {
  return requestQuery.status !== undefined
}
const priorityCheck = requestQuery => {
  return requestQuery.priority !== undefined
}
app.get('/todos/', async (request, response) => {
  let getTodoQuery = ''
  let data = null
  const {status, priority, search_q = ''} = request.query
  switch (true) {
    case statusAndpriorityCheck(request.query):
      getTodoQuery = `
        SELECT 
          * 
        FROM 
          todo 
        WHERE 
          status LIKE "%${status}%" 
          AND 
          priority LIKE "%${priority}%"; 
    `
      data = await db.all(getTodoQuery)
      response.send(data)
      break
    case statusCheck(request.query):
      getTodoQuery = `
        SELECT 
          * 
        FROM 
          todo
        WHERE
        status LIKE "%${status}%"; 
    `
      data = await db.all(getTodoQuery)
      response.send(data)
      break
    case priorityCheck(request.query):
      getTodoQuery = `
        SELECT 
          * 
        FROM 
          todo 
        WHERE 
          priority LIKE "%${priority}%"; 
    `
      data = await db.all(getTodoQuery)
      response.send(data)
      break
    default:
      getTodoQuery = `
        SELECT 
          * 
        FROM 
          todo 
        WHERE 
          todo LIKE "%${search_q}%"; 
    `
      data = await db.all(getTodoQuery)
      response.send(data)
  }
})

//todoid
app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const todoIdQuery = `
      SELECT 
        * 
      FROM
        todo
      WHERE
        id = ${todoId};
  `
  const todoIdArray = await db.get(todoIdQuery)
  response.send(todoIdArray)
})

//todo post
app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status} = request.body
  const postTodoQuery = `
      INSERT INTO
        todo (id, todo, priority, status)
      VALUES (
        ${id},
        "${todo}",
        "${priority}",
        "${status}");
  `
  await db.run(postTodoQuery)
  response.send('Todo Successfully Added')
})

//jj
app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  let updateColumn = ''
  const requestBody = request.body
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = 'Status'
      break
    case requestBody.priority !== undefined:
      updateColumn = 'Priority'
      break
    case requestBody.todo !== undefined:
      updateColumn = 'Todo'
      break
  }
  const previousTodoQuery = `
    SELECT * FROM todo WHERE id = ${todoId};
  `
  const previousTodo = await db.get(previousTodoQuery)
  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body
  const updateTodo = `
      UPDATE todo
      SET 
        todo = "${todo}",
        priority = "${priority}",
        status = "${status}"
      WHERE
        id = ${todoId};
  `
  await db.run(updateTodo)
  response.send(`${updateColumn} Updated`)
})

//delete

app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const deleteTodoQuery = `
      DELETE FROM todo WHERE id = ${todoId};
  `
  await db.run(deleteTodoQuery)
  response.send('Todo Deleted')
})

module.exports = app
