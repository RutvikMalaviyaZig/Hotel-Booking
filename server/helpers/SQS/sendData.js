import { sqs } from "../../config/constant.js";
import { SendMessageCommand } from "@aws-sdk/client-sqs";

export const sendSQSMessage = async (type, data) => {
    let queueUrl;
    switch (type) {
        case "booking":
            queueUrl = process.env.BOOKING_QUEUE_URL;
            break;
        default:
            throw new Error("Invalid type");
    }

    const params = {
        MessageBody: JSON.stringify({ type, data }),
        QueueUrl: queueUrl,
    }
    const command = new SendMessageCommand(params);
    try {
        const data = await sqs.send(command);
        console.log("Message sent successfully", data);
        return true;
    } catch (error) {
        console.log("Error sending message", error);
        return false;
    }
}