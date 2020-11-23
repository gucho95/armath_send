// firebase variables
const storage = firebase.storage();
const firestore = firebase.firestore();
const storageRef = firebase.storage().ref();
//
let uploadTask;
const upload_input = document.getElementById("upload");
const progress_overlay = document.getElementsByClassName("upload-overlay")[0];
const progress_block = document.getElementsByClassName("upload-progress-indicator")[0];
const progress_percent_block = document.getElementsByClassName("upload-progress-percent")[0];
const success_overlay = document.getElementsByClassName("success-overlay")[0];
const result_input = document.getElementById("result-url");

const table = document.getElementsByClassName("uploaded-files-list")[0];

const uploads_table = table.getElementsByTagName("tbody")[0];
const uploads_table_wrapper = document.getElementsByClassName("uploaded-files-wrapper")[0];
const closeResultOverlay = () => (success_overlay.style.display = "none");

const onFileChange = (event) => {
  const file = event.target.files[0];
  upload_input.value = "";
  const fileRef = storageRef.child(file.name);

  uploadTask = fileRef.put(file);

  uploadTask.on(
    "state_changed",
    function (snapshot) {
      // Observe state change events such as progress, pause, and resume
      // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
      var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;

      progress_block.style.width = `${progress}%`;
      progress_percent_block.innerText = `${progress.toFixed()}%`;

      switch (snapshot.state) {
        case firebase.storage.TaskState.PAUSED: // or 'paused'
          break;
        case firebase.storage.TaskState.RUNNING: // or 'running'
          progress_overlay.style.display = "flex";
          break;
      }
    },
    function (error) {
      console.log(error);
      // Handle unsuccessful uploads
    },

    function () {
      uploadTask.snapshot.ref.getDownloadURL().then(function (downloadURL) {
        const fileName = uploadTask.snapshot.metadata.fullPath;
        const filzeSize = uploadTask.snapshot.metadata.size;
        const fileURL = downloadURL;
        const fileFullPath = uploadTask.snapshot.metadata.fullPath;

        const object = {
          fileName,
          filzeSize,
          fileURL,
          fileFullPath,
        };
        setUploadedFiles(object);
        renderUploadedFiles();
        progress_overlay.style.display = "none";
        success_overlay.style.display = "flex";
        result_input.value = downloadURL;
      });
    }
  );
};

const onUploadCancel = () => {
  uploadTask.cancel();
  progress_overlay.style.display = "none";
};

const copyToClipboard = (id) => {
  const input = document.getElementById(id);
  input.select();
  document.execCommand("copy");
  closeResultOverlay();
};

const getUploadedFiles = () => {
  const uploadedFiles = localStorage.getItem("uploads");
  const array = uploadedFiles ? JSON.parse(uploadedFiles) : [];
  return array;
};

const setUploadedFiles = (object) => {
  const uploads = getUploadedFiles();
  localStorage.setItem("uploads", JSON.stringify(uploads ? [...uploads, object] : [object]));
};

const removeUploadedFile = (url) => {
  const uploadedFiles = getUploadedFiles();
  const currentUploads = uploadedFiles.filter((it) => it.fileURL !== url);
  localStorage.setItem("uploads", JSON.stringify(currentUploads));
};

const renderUploadedFiles = () => {
  const uploadedFiles = getUploadedFiles();
  uploads_table.innerHTML = "";
  if (uploadedFiles && uploadedFiles.length) {
    uploads_table_wrapper.appendChild(table);
  } else {
    uploads_table_wrapper.innerHTML = "";
  }
  uploadedFiles.map((file) => {
    const newRow = uploads_table.insertRow();
    const cell1 = newRow.insertCell(0);
    const cell2 = newRow.insertCell(1);
    const cell3 = newRow.insertCell(2);
    const cell1Text = document.createTextNode(file.fileName);
    const cell2Text = document.createTextNode((file.filzeSize / (1024 * 1024)).toFixed(2) + " MB");
    const cell3Body = document.createElement("div");
    cell3Body.style.display = "flex";
    const cell3Input = document.createElement("input");
    cell3Input.setAttribute("id", file.fileURL);
    cell3Input.style.display = "none";
    const cell3Button = document.createElement("button");
    cell3Button.setAttribute("class", "info-btn");

    const cell4Text = document.createElement("button");
    cell4Text.setAttribute("class", "danger-btn");
    cell4Text.innerHTML = "<i class='fa fa-trash'></i>";
    var fileRef = storageRef.child(file.fileFullPath);
    cell4Text.onclick = () =>
      fileRef
        .delete()
        .then(() => {
          removeUploadedFile(file.fileURL);
          renderUploadedFiles();
        })
        .catch(() => {
          removeUploadedFile(file.fileURL);
          renderUploadedFiles();
          alert("Նման ֆայլ չի գտնվել");
        });
    cell3Button.innerHTML = '<i class="fa fa-copy"></i>';

    cell3Button.onclick = () => copyToClipboard(file.fileURL);
    cell3Input.value = file.fileURL;
    cell1.appendChild(cell1Text);
    cell2.appendChild(cell2Text);
    cell3Body.append(cell3Input);
    cell3Body.append(cell3Button);
    cell3Body.append(cell4Text);
    cell3.append(cell3Body);
    cell3.appendChild(cell3Body);
  });
};

renderUploadedFiles();
