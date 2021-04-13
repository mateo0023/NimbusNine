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
            itemsList.innerHTML = response.data;
            addClickLink();
        }).catch((err) => {
            console.log(err);
        });
    };

    newFolderButton.onclick = () => {
        // This prompt is far from ideal.
        // would need to create nice HTML/JS code for it
        let name = window.prompt("Enter the folder's name");
        if (name !== null) {
            axios({
                method: 'post',
                url: `${window.location.origin}/newFolder/${parentId}`,
                data: {
                    name: name
                }
            }).then(response => {
                // Will receive the folder ID to go to
                location.reload();
            }).catch(err => {
                console.log(err);
            });
        }
    };
})();