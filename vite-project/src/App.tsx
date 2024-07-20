import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import { AppBar, Box, Button, Divider, ListItemButton, ListItemText, Modal, SpeedDial, SpeedDialAction, SpeedDialIcon, Toolbar, Typography } from '@mui/material';

import { useEffect, useState } from 'react';
import { useRef } from 'react';
import InsertLinkIcon from '@mui/icons-material/InsertLink';

const api_url = "/api"
function App() {

  const [openModal, setOpenModal] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState(null);

  const handleOpenModal = (paper) => {
    setSelectedPaper(paper);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };



  const [papers, setPapers] = useState([]);
  useEffect(() => {
    fetch(`${api_url}/list_articles`).then(response => response.json()).then(data => {
      setPapers(data);
    })
  }, [])


  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    console.log(file)
  };

  const file_selector = useRef<HTMLInputElement>(null);
  return (
    <>
      {selectedPaper && <Modal open={openModal} onClose={handleCloseModal}>
        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 400, bgcolor: 'background.paper', boxShadow: 24, p: 4 }}>
          <div style={{ overflowY: 'scroll', maxHeight: 'calc(100vh - 64px)' }}>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              {selectedPaper.title}
            </Typography>
            {selectedPaper.audios.map((audio, index) => (
              <div key={index}>
                {/* # text showing audio filename */}
                <p>{audio}</p>
                <audio controls>
                  <source src={`${api_url}/get_audio/${selectedPaper.id}/${audio}`} />
                </audio>
                <Typography variant="body1" component="div">
                  {audio.filename}
                </Typography>
              </div>
            ))}
          </div>
        </Box>
      </Modal>}

      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>

            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Listen to Papers
            </Typography>
            <Button color="inherit" onClick={() => {
              const key = prompt("Enter API Key");
              if (key) {
                localStorage.setItem("api_key", key);
              }
            }}>Set API Key</Button>
          </Toolbar>
        </AppBar>


        <List>
          {
            papers.map((paper: any, index) => {
              return (
                <div key={index}>
                  <ListItem disablePadding onClick={() => {
                    fetch(`${api_url}/get_article/${paper.id}`).then(response => response.json()).then(data => {
                      handleOpenModal({ ...paper, audios: data })

                    })

                  }}>
                    <ListItemButton>
                      <ListItemText primary={paper.title} secondary={paper.id} />
                    </ListItemButton>
                  </ListItem>
                  <Divider />
                </div>
              )
            })

          }
        </List>
        <input ref={file_selector} type="file" onChange={handleFileChange} hidden />

        <SpeedDial
          ariaLabel="SpeedDial basic example"
          sx={{ position: 'absolute', bottom: 16, right: 16 }}
          icon={<SpeedDialIcon />}
        >
          {/* <SpeedDialAction
            icon=<PictureAsPdfIcon />
            tooltipTitle="Upload PDF"
            onClick={() => {
              file_selector.current?.click();
            }}
          /> */}
          <SpeedDialAction
            icon=<InsertLinkIcon />
            tooltipTitle="Enter a Link"
            onClick={() => {
              const link = prompt("Enter Arxiv Link");
              if (link) {
                fetch(`${api_url}/arxiv?url=${link}`, {
                  method: "POST",
                  headers: {
                    "Authorization": `Bearer ${localStorage.getItem("api_key")}` || ""
                  }
                }).then(response => response.json()).then(data => {
                  if (!data["error"]) {
                    alert("Success");
                  } else {
                    alert("Error: " + data["error"]);
                  }
                }
                )
              }
            }}
          ></SpeedDialAction>
        </SpeedDial>
      </Box>

    </>
  )
}

export default App

