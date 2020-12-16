import React, { useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import HomeIcon from '@material-ui/icons/Home';
import RefreshIcon from '@material-ui/icons/Refresh';
import DeleteForeverIcon from '@material-ui/icons/DeleteForever';
import PropTypes from 'prop-types';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Paper from '@material-ui/core/Paper';
import CloudDownloadIcon from '@material-ui/icons/CloudDownload';
import red from '@material-ui/core/colors/red';
import yellow from '@material-ui/core/colors/yellow';
import green from '@material-ui/core/colors/green';
import Container from '@material-ui/core/Container';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Firebase from 'firebase'
import { RateReview } from '@material-ui/icons';
import Chip from '@material-ui/core/Chip';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import AccessTimeIcon from '@material-ui/icons/AccessTime';
import swal from 'sweetalert';

require('dotenv').config();

const json2csv = require('json2csv');

try {
  Firebase.initializeApp({
    apiKey: process.env.REACT_APP_API_KEY,
    authDomain: "botitc.firebaseapp.com",
    projectId: "botitc",
    storageBucket: "botitc.appspot.com",
    messagingSenderId: "247885071528",
    appId: process.env.REACT_APP_APP_ID,
    measurementId: "G-1TJJXQLJ86"
  })
} catch (err) {

  if (!/already exists/.test(err.message)) {

    console.error('Firebase initialization error raised', err.stack)

  }
}

var db = Firebase.firestore();

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
  },
  menuButton: {
    marginRight: theme.spacing(2),
  },
  title: {
    flexGrow: 1,
  },
  table: {
    minWidth: 650,
  }
}));

export default function App() {
  const classes = useStyles();
  const [value, setValue] = React.useState(0);
  const [data, setData] = React.useState([]);
  const [claves, setClaves] = React.useState([]);
  const [showDoneAlert, setShowDoneAlert] = React.useState(false);
  const [espera, setEspera] = React.useState(true);

  const handleChange = (event, newValue) => {
    setEspera(!espera);
    setValue(newValue);
  };

  const fetchData = async () => {
    var temp = []
    var temp2 = []
    await db.collection("cursos").get()
      .then((querySnapshot) => {
        setData(querySnapshot.data);
        querySnapshot.forEach((doc) => {
          console.log(doc.data());
          temp.push(doc.data());
          temp2.push(doc.id);
        });
        setData(temp);
        setClaves(temp2);
      });
  }

  useEffect(() => {
    fetchData();
  }, []);

  const deleteCollection = async () => {
    const collectionRef = db.collection('cursos');
    const query = collectionRef.orderBy('__name__');
    return new Promise((resolve, reject) => {
      deleteQueryBatch(query, resolve).catch(reject);
    });
  }

  async function deleteQueryBatch(query, resolve) {
    const snapshot = await query.get();

    const batchSize = snapshot.size;
    if (batchSize === 0) {
      // When there are no documents left, we are done
      resolve();
      return;
    }

    // Delete documents in a batch
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    // Recurse on the next process tick, to avoid
    // exploding the stack.
    process.nextTick(() => {
      deleteQueryBatch(db, query, resolve);
    });
    window.location.reload();

  }


  const handleDeleteAll = () => {
    swal({
      title: "Borrar TODA la base de datos",
      text: "¿Seguro que quiere continuar?",
      icon: "warning",
      buttons: true,
      dangerMode: true,
    })
      .then((willDelete) => {
        if (willDelete) {
          swal("Contraseña", {
            content: "input",
          })
            .then((value) => {
              if (value === process.env.REACT_APP_CONTRA) {
                deleteCollection()
                swal("Borrado con exito");
              } else {
                swal("Contrasea incorrecta");
              }
            });
        } else {
          swal("Cancelado. No hay cambios.");
        }
      });


  }

  const handleExport = () => {

  }

  const handleRefresh = () => {
    fetchData();
  }


  const handleClick = (alumno, clave) => {
    const a = alumno[0]
    const carrera = alumno[1].carrera
    const date = alumno[1].date
    swal({
      title: "¿Alumno atendido?",
      text: "¿Seguro que quiere marcar como atendido al alumno?",
      icon: "warning",
      buttons: true,
      dangerMode: true,
    })
      .then((willDelete) => {
        if (willDelete) {
          var data = {
            [a]: { 'done': true, 'carrera': carrera, 'date': date }
          }
          const alumno = db.collection("cursos").doc(clave).update(data)
            .then(function () {
              console.log("Document successfully updated!");
              setData([]);
              setClaves([]);
              fetchData();
            })
            .catch(function (error) {
              // The document probably doesn't exist.
              console.error("Error updating document: ", error);
            });
          swal("Cambio realizado.", {
            icon: "success",
          });
        } else {
          swal("Cancelado. No hay cambios.");
        }
      });
    console.info('You clicked the Chip.');
  };

  const renderMatriculas = (r, clave) => {
    if (espera) {
      return (
        Object.entries(r).map((d) => {
          console.log(d[1].done);
          if (d[1].done === false) {
            return (
              <TableCell component="th" scope="row">
                {d[0]}
                <Chip size="small" label={d[1].carrera} />
                {d[1].done ? <Chip style={{ backgroundColor: green[500] }} size="small" label="Atendido" disable deleteIcon={<CheckCircleIcon />} /> : <Chip style={{ backgroundColor: yellow[500] }} size="small" label="En Espera" onClick={() => handleClick(d, clave)} deleteIcon={<AccessTimeIcon />} />}
              </TableCell>
            );
          }
        })
      );
    } else {
      return (
        Object.entries(r).map((d) => {
          console.log(d[1].done);
          if (d[1].done === true) {
            return (
              <TableCell component="th" scope="row">
                {d[0]}
                <Chip size="small" label={d[1].carrera} />
                {d[1].done ? <Chip style={{ backgroundColor: green[500] }} size="small" label="Atendido" disable deleteIcon={<CheckCircleIcon />} /> : <Chip style={{ backgroundColor: yellow[500] }} size="small" label="En Espera" onClick={() => handleClick(d, clave)} deleteIcon={<AccessTimeIcon />} />}
              </TableCell>
            );
          }
        })
      );
    }

  }

  if (data) {
    console.log(process.env)
    return (
      <div className={classes.root}>
        <AppBar position="static">
          <Toolbar>
            <IconButton edge="start" className={classes.menuButton} color="inherit" aria-label="menu">
              <HomeIcon />
            </IconButton>
            <Typography variant="h6" className={classes.title}>
              Listas de Espera por Materia
          </Typography>
            <IconButton color="inherit" onClick={() => { handleRefresh() }}>
              <RefreshIcon />
            </IconButton>
            <Button color="inherit" endIcon={<CloudDownloadIcon />}>Exportar</Button>
            <IconButton style={{ color: red[500] }} fontSize="large" onClick={() => { handleDeleteAll() }}>
              <DeleteForeverIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
        <Paper className={classes.root}>
          <Container>
            <Tabs
              value={value}
              onChange={handleChange}
              indicatorColor="primary"
              textColor="primary"
            >
              <Tab label="Alumnos en Espera" />
              <Tab label="Alumnos Atentidos" />
            </Tabs>
          </Container>
        </Paper>
        <Container>
          <TableContainer component={Paper}>
            <Table className={classes.table} aria-label="simple table">
              <TableHead>
                <TableRow>
                  <TableCell>Clave</TableCell>

                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((row, i) => (
                  <TableRow key={row.id}>
                    <TableCell component="th" scope="row">
                      {claves[i]}
                    </TableCell>
                    {renderMatriculas(row, claves[i])}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Container>
      </div>
    );
  } else {
    return (
      <div>
        <AppBar position="static">
          <Toolbar>
            <IconButton edge="start" className={classes.menuButton} color="inherit" aria-label="menu">
              <HomeIcon />
            </IconButton>
            <Typography variant="h6" className={classes.title}>
              Listas de Espera por Materia
          </Typography>
            <IconButton color="inherit" onClick={() => { handleRefresh() }}>
              <RefreshIcon />
            </IconButton>
            <Button color="inherit" endIcon={<CloudDownloadIcon />}>Exportar</Button>
            <IconButton style={{ color: red[500] }} fontSize="large" onClick={() => { handleDeleteAll() }}>
              <DeleteForeverIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
        <div>
          No hay listas
      </div>
      </div>
    )
  }
}