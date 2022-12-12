const express = require('express');

const host = 'localhost';
const port = 8080;
const apiEndPoint = '/api/';

// ToDoの初期データ
const todos = [
  { id: 1, title: 'ネーム', completed: true },
  { id: 2, title: '下書き', completed: false },
  { id: 3, title: '清書', completed: false },
];

const importantTodos = [1, 2];

// ユーザデータ
const userProfile = { 
  id: 'KCG',
  name: '京都コンピュータ学院',
  birthday: '1963年〇月△日',
  hobby: 'プログラミング',
};

// 設定データ
// 実際には使っていないが、設定してみる
const config = {
  sortBy: 'title', // ToDoをタイトルでソート
  sortOrder: 'ascendant', // 昇順（小から大の順）
  lang: 'ja', // 日本語で表示
};

const app = express();

// テンプレートエンジンを ejs に設定
app.set('view engine', 'ejs');
// テンプレートが置かれるディレクトリを設定。
// （なお、設定しなくてもデフォルトは ./views です）
app.set('views', './views');

/* 
 * 動的ページ(SSR)
 */

app.get('/', (req, res) => {
  // テンプレートファイル ./views/index.ejs 元にHTMLを生成
  res.render('index', { user: userProfile });
});

app.get('/profile', (req, res) => {
  res.render('profile', { user: userProfile });
});

app.get('/config', (req, res) => {
  res.render('config', {
    user: userProfile,
    config
  });
});

app.get('/important', (req, res) => {
  const iTodos = [];
  for(let i=0; i<todos.length; i++){
    if(importantTodos.includes(todos[i].id)) iTodos.push(todos[i]);
  }
  // 1行で書くならこうです
  // const iTodos = todos.filter(todo => importantTodos.includes(todo.id));
  res.render('important', {
    user: userProfile,
    todos: iTodos,
  });
});



// 上記以外のURLは、staticディレクトリ以下のファイルを静的ページとして返す
app.use(express.static('static'));

/*
 * REST API 
 */
// リクエスト本文のJSON文字列を自動的にオブジェクトへ変換
app.use(express.json());

app.get(apiEndPoint + 'todos', (req, res) => {
    res.json(todos);
});

app.get(apiEndPoint + 'todos/:id', (req, res, next) => {
    const todo = todos.find(todo => todo.id === parseInt(req.params.id));
    if (todo) {
        return res.json(todo);
    }
    const err = new Error(req.params.id + ' is not found.');
    err.statusCode = 404;
    next(err);
});

app.post(apiEndPoint + 'todos', (req, res, next) => {
    const obj = req.body; // リクエスト本文のJSON文字列から変換されたオブジェクト
    const title = obj.title;
    if (typeof title !== 'string' || !title) {
        const err = new Error('title is required');
        err.statusCode = 400;
        return next(err);
    }
    const lastId = todos[todos.length - 1].id;
    const newTodo = {
        title,
        id: lastId + 1,
        completed: false,
    };
    todos.push(newTodo);
    console.log(`Added new todo: ${JSON.stringify(newTodo)}`);
    // 201 Created を返す
    res.status(201).json(newTodo);
});

app.put(apiEndPoint + 'todos/:id', (req, res, next) => {
    const todo = todos.find(todo => todo.id === parseInt(req.params.id));
    if (todo) {
        const obj = req.body; // リクエスト本文のJSON文字列から変換されたオブジェクト
        Object.keys(obj).forEach(key => {
            todo[key] = obj[key];
        });
        console.log(`Updated todo: ${JSON.stringify(todo)}`);
        return res.json(todo);
    }
    const err = new Error(req.params.id + ' is not found.');
    err.statusCode = 404;
    next(err);
});

app.delete(apiEndPoint + 'todos/:id', (req, res, next) => {
    const todoIndex = todos.findIndex(todo => todo.id === parseInt(req.params.id));
    if (todoIndex >= 0) {
        todos.splice(todoIndex, 1);
        console.log(`Deleted todo id: ${req.params.id}`);    
        return res.json({ id: req.params.id });
    }
    const err = new Error(req.params.id + ' is not found.');
    err.statusCode = 404;
    next(err);
});

// エラーハンドリングミドルウェア 教科書 p.184
app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.statusCode || 500).json({ error: err.message });
});

app.listen(port, host, () => console.log("Express server has been started!"));