document.addEventListener('DOMContentLoaded', function () {
    const _apiLink = "http://erp.muraddev.com/api";
    const wrapper = document.querySelector('.main-wrapper');
    const fetchDataBtn = document.querySelector('.add_column');
    const main_title = document.querySelector('.main_title');
    const header = document.querySelector('.header-section>div');

    async function getData(url) {
        const res = await fetch(url);
        return await res.json();
    }

    async function fetchData(url, body = null) {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        const data = await res.json();
        if (res.status >= 400) {
            handleError(data);
            throw new Error(data.message || 'An error occurred');
        }

        return data;
    }

    function handleError(data) {
        let errorMessage = 'An error occurred';
        if (data.errors) {
            errorMessage = Object.values(data.errors).map(errArray => errArray.join(', ')).join('\n');
        } else if (data.message) {
            errorMessage = data.message;
        }

        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: errorMessage,
        });
    }

    fetchDataBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        fetchData(_apiLink + '/add_column').then(res => {
            renderData(res);
        }).catch(error => console.error(error));
    });

    function renderData() {
        getData(_apiLink + '/getBoardTitle').then(res => {
            header.textContent = res.value;
        }).catch(error => console.error(error));

        getData(_apiLink + '/get_columns').then(res => {
            const taskWrappers = document.querySelectorAll('.task-wrapper');
            taskWrappers.forEach(wrapper => {
                if (!wrapper.classList.contains('add_column')) {
                    wrapper.remove();
                }
            });

            res.forEach(el => {
                const element = document.createElement('div');
                element.classList.add('task-wrapper');
                element.setAttribute('data-column-id', el.id); 
                const deleteColumnBtn = document.createElement('div');
                deleteColumnBtn.classList.add('delete_column');
                deleteColumnBtn.textContent = 'X';
                deleteColumnBtn.addEventListener('click', async () => {
                    const result = await Swal.fire({
                        title: 'Are you sure?',
                        text: "Do you want to delete this column?",
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonText: 'Yes, delete it!',
                        cancelButtonText: 'No, cancel!',
                    });

                    if (result.isConfirmed) {
                        fetchData(_apiLink + "/delete_column/" + el.id)
                            .then(() => renderData())
                            .catch(error => console.error(error));
                    }
                });
                element.appendChild(deleteColumnBtn);
                wrapper.appendChild(element);

                const title = document.createElement('p');
                title.classList.add('task-category');
                title.setAttribute('contenteditable', true);
                title.addEventListener('keydown', function (e) {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        fetchData(_apiLink + "/update_column_title/" + el.id, {
                                data: {
                                    'title': this.textContent
                                }
                            }).then(() => renderData())
                            .catch(error => console.error(error));
                    }
                });
                title.textContent = el.title;
                element.appendChild(title);

                const form = document.createElement('form');
                form.classList.add('task-form');
                const textarea = document.createElement('input');
                const button = document.createElement('button');
                button.textContent = 'Add Task';
                form.appendChild(textarea);
                form.appendChild(button);
                element.appendChild(form);

                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    fetchData(_apiLink + '/add_task/' + el.id, {
                            data: {
                                'value': textarea.value
                            }
                        }).then(() => renderData())
                        .catch(error => console.error(error));
                });
                const TasksWrapper = document.createElement('div');
                TasksWrapper.classList.add('task-items');
                element.appendChild(TasksWrapper);
                el.tasks.forEach(task => {
                    const taskItem = document.createElement('div');
                    taskItem.classList.add('task-item');
                    taskItem.setAttribute('data-task-id', task.id); 
                    const taskItemParagraph = document.createElement('p');
                    taskItemParagraph.textContent = task.text;
                    taskItemParagraph.setAttribute('contenteditable', true);
                    taskItemParagraph.addEventListener('keydown', function (e) {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            fetchData(_apiLink + "/update_task/" + task.id, {
                                    data: {
                                        'text': this.textContent
                                    }
                                }).then(() => renderData())
                                .catch(error => console.error(error));
                        }
                    });
                    taskItem.appendChild(taskItemParagraph);

                    const deleteTaskBtn = document.createElement('div');
                    deleteTaskBtn.classList.add('delete_task');
                    deleteTaskBtn.textContent = 'X';
                    deleteTaskBtn.addEventListener('click', async () => {
                        const result = await Swal.fire({
                            title: 'Are you sure?',
                            text: "Do you want to delete this task?",
                            icon: 'warning',
                            showCancelButton: true,
                            confirmButtonText: 'Yes, delete it!',
                            cancelButtonText: 'No, cancel!',
                        });

                        if (result.isConfirmed) {
                            fetchData(_apiLink + "/delete_task/" + task.id)
                                .then(() => renderData())
                                .catch(error => console.error(error));
                        }
                    });
                    taskItem.appendChild(deleteTaskBtn);
                    TasksWrapper.appendChild(taskItem);
                });

                new Sortable(TasksWrapper, {
                    group: 'tasks',
                    animation: 150,
                onEnd: function (evt) {
                    const columns = document.querySelectorAll('.task-wrapper');
                    const tasks = [];

                    columns.forEach(column => {
                        const columnId = column.getAttribute('data-column-id');
                        const taskItems = column.querySelectorAll('.task-item');

                        taskItems.forEach((task, index) => {
                            tasks.push({
                                id: task.getAttribute('data-task-id'),
                                order: index,
                                column_id: columnId
                            });
                        });
                    });

                    console.log(tasks); // Bütün tapşırıqların sifarişini yoxlamaq

                    fetchData(_apiLink + '/update_task_order', {
                        tasks: tasks
                    }).then(res => {
                        console.log(res);
                        checkEmptyState();
                    }).catch(error => console.error(error));
                }

                });
            });

            checkEmptyState();
        }).catch(error => console.error(error));
    }

    renderData();

    main_title.addEventListener('blur', function (e) {
        fetchData(_apiLink + "/update_translate/1", {
                data: {
                    'value': this.textContent
                }
            }).then(() => renderData())
            .catch(error => console.error(error));
    });

    function checkEmptyState() {
        const taskWrappers = document.querySelectorAll('.task-wrapper');
        taskWrappers.forEach(wrapper => {
            if (wrapper.querySelectorAll('.task-item').length === 0) {
                if (!wrapper.querySelector('.empty')) {
                    const emptyMessage = document.createElement('p');
                    emptyMessage.textContent = 'Empty';
                    emptyMessage.classList.add('empty');
                    wrapper.appendChild(emptyMessage);
                }
            } else {
                const emptyMessage = wrapper.querySelector('.empty');
                if (emptyMessage) {
                    emptyMessage.remove();
                }
            }
        });
    }
});
