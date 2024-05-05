import { useState } from "react";
import { Button, Grid, Input, Typography } from "@mui/joy";
import { Link } from "react-router-dom";

export default function Unsubscribe() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  function unsubscribeFromEmailList() {
    if (!email) {
      return;
    }

    fetch(`/api/email-list?operation=unsubscribe&email=${email}`, {
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
        Unsubscribe from paid Expensify/App issues
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
            <Button
              variant="solid"
              size="lg"
              onClick={unsubscribeFromEmailList}
            >
              Submit
            </Button>
          </Grid>
        </Grid>
        {error && (
          <Grid>
            <Typography color="danger">{error}</Typography>
          </Grid>
        )}
        {showSuccess && <Typography color="success">Unsubscribed!</Typography>}
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
        <Link to="/">
          <Typography>Subscribe</Typography>
        </Link>
      </Grid>
    </Grid>
  );
}
