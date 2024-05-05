import { useState } from "react";
import { Button, Grid, Input, Typography } from "@mui/joy";
import { Link } from "react-router-dom";

export default function Subscribe() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  function subscribeToEmailList() {
    if (!email) {
      return;
    }

    fetch(`/api/email-list?operation=subscribe&email=${email}`, {
      method: "POST",
    }).then((res) => {
      res.text().then((body) => {
        if (res.status !== 200) {
          setShowSuccess(false);
          setError(body);
          return;
        }

        setShowSuccess(true);
        setError("");
        setEmail("");
      });
    });
  }

  return (
    <Grid
      container
      direction="column"
      sx={{
        minHeight: "100vh",
        alignItems: "center",
        // justify them 25% down the screen
        justifyContent: "flex-start",
        paddingTop: "25vh",
      }}
    >
      <Typography level="h1" margin={4}>
        Subscribe to receive email notifications when a paid issue is created
        for Expensify/App
      </Typography>
      <Grid>
        <Grid container direction="row" spacing={1}>
          <Grid>
            <Input
              placeholder="Email"
              error={!!error}
              size="lg"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Grid>
          <Grid>
            <Button variant="solid" size="lg" onClick={subscribeToEmailList}>
              Submit
            </Button>
          </Grid>
        </Grid>
        {error && (
          <Grid>
            <Typography color="danger">{error}</Typography>
          </Grid>
        )}
        {showSuccess && <Typography color="success">Subscribed!</Typography>}
      </Grid>
      <Grid
        sx={{
          position: "absolute",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Link to="/unsubscribe">
          <Typography>Unsubscribe</Typography>
        </Link>
      </Grid>
    </Grid>
  );
}
