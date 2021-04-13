(function () {
    const newFolderButton = document.querySelector("#new-folder-btn");
    const uploadFileButton = document.querySelector("#upload-file-btn");
    const uploadFileSelector = document.querySelector("#file-input");

    const itemsList = document.querySelector(".dash__directory-list")
    const parentId = document.getElementsByName("host-folder-id")[0].content;

    function addClickLink() {
        document.querySelectorAll(".dash__directory-list-item").forEach(item => {
            item.onclick = () => {
                window.location.replace(`${window.location.origin}/view/${item.id}`)
            };
        })
    }
    addClickLink();

    uploadFileButton.onclick = (e) => {
        uploadFileSelector.click();
    };

    uploadFileSelector.onchange = (e) => {
        const fileList = uploadFileSelector.files;
        var formData = new FormData();
        for (let i = 0; i < fileList.length; i++) {
            formData.append("file", fileList[i]);
        }

        axios.post(`${window.location.origin}/upload/${parentId}`,
            formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        }).then(response => {
            document.querySelector(".dash__directory-list").innerHTML = response.data;
            addClickLink();
        }).catch((err) => {
            console.log(err);
        });
    };

    newFolderButton.onclick = () => {
        let name = prompt("Enter the folder's name")
        if (name !== null) {
            axios({
                method: 'post',
                url: `${window.location.origin}/newFolder/${parentId}`,
                data: {
                    name: name
                }
            }).then(response => {
                window.location.replace(`${window.location.origin}/view/${response.data}`)
            }).catch(err => {
                console.log(err);
            });
        }
    };
})();