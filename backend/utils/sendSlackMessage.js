import axios from "axios";

export const sendSlackMessage = async (channel, text) => {
  try {
    await axios.post(
      "https://slack.com/api/chat.postMessage",
      { channel, text },
      {
        headers: {
          Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (err) {
    console.log("Slack error", err.response?.data || err.message);
  }
};
