

class BaseDB {
    constructor(dbName, storeName, keyPath="id", version=1) {
        this.dbName = dbName;
        this.storeName = storeName;
        this.keyPath = keyPath;
        this.version = version;
        this.db = null;
    }

    /**
     * IndexedDBをオープンする
     */
    async open() {
        if (this.db) { return this.db;}
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName,this.version);
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName, {keyPath: this.keyPath});
                }
            };
            request.onsuccess = (event) => {this.db = event.target.result; resolve(this.db);};
            request.onerror = () => {reject(request.error);};
        });
    }

    async create(option={}){
        const data = {}
        return data;
    }

    /**
     * データ取得
     */
    async get(key) {
        const db = await this.open();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(
                this.storeName,
                "readonly"
            );
            const store = transaction.objectStore(this.storeName);
            const request = store.get(key);
            request.onsuccess = () => {resolve(request.result);};
            request.onerror = () => {reject(request.error);};
        });
    }

    /**
     * 全データ取得
     */
    async get_all() {
        const db = await this.open();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(this.storeName,"readonly");
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();
            request.onsuccess = () => {resolve(request.result);};
            request.onerror = () => {reject(request.error);};
        });
    }

    /**
     * データ登録・更新
     */
    async set(data) {
        const db = await this.open();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(this.storeName,"readwrite");
            const store = transaction.objectStore(this.storeName);
            const request = store.put(data);
            request.onsuccess = () => {resolve(request.result);};
            request.onerror = () => {reject(request.error);};
        });
    }

    /**
     * データ削除
     */
    async delete(key) {
        const db = await this.open();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(this.storeName,"readwrite");
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(key);
            request.onsuccess = () => {resolve();};
            request.onerror = () => {reject(request.error);};
        });
    }


    /**
     * タスク状態変更
     */
    async update(key, values) {
        const task = await this.get(key);
        if (!task) {
            throw new Error(`Task not found: ${key}`);
        }
        Object.assign(task, values);
        task.updated_at = Date.now();
        await this.set(task);
        return task;
    }

    async success(key) {
        return await this.update(key, {
            status: TaskDB.STATUS.SUCCESS,
        });
    }

    async success(key) {
        return await this.update(key, {
            status: TaskDB.STATUS.FAILED,
        });
    }

    async running(key) {
        return await this.update(key, {
            status: TaskDB.STATUS.RUNNING,
        });
    }
}

class TaskDB extends BaseDB {

    static STATUS = {PENDING:"PENDING",RUNNING:"RUNNING",SUCCESS:"SUCCESS",FAILED:"FAILED"};
    static PREFIX = "TASK_";

    constructor(dbName="TaskDB") {
        super(
            dbName,          // IndexedDBのDB名
            "tasks",         // Object Store名
            "id",            // Primary Key
            1                // Version
        );
    }

    uuid(){
        return crypto.randomUUID();
    }

    /**
     * タスク登録
     */
    async add_task(title) {
        const task = {
            id: crypto.randomUUID(),
            title: title,
            status: TaskDB.STATUS.PENDING,
            created_at: Date.now(),
            updated_at: Date.now(),
        };
        await this.set(task);
        return task;
    }

    async create(option={}){
        const uuid = this.uuid();
        const task = {
            id: option.id ?? uuid,
            title: option.title ?? `${TaskDB.PREFIX}${uuid}`,
            status: option.status ?? TaskDB.STATUS.PENDING,
            created_at: Date.now(),
            updated_at: Date.now(),
            
        };
        await this.set(task);
        return task
    }
}