import { sqs } from "../config/constant.js";
import { ReceiveMessageCommand } from "@aws-sdk/client-sqs";
import { processBooking } from "../processBookingData/processBooking.js";
import { deleteSQSMessage } from "./deleteData.js";

const processMessageByType = async (type, data) => {
    switch (type) {
        case "booking":
            try {
                // Handle both create and update actions
                if (data.action === "create") {
                    await processBooking(data);
                } else if (data.action === "update") {
                    await processBooking(data);
                } else if (data.action === "delete") {
                    await processBooking(data);
                } else {
                    throw new Error(`Invalid action: ${data.action}`);
                }
            } catch (error) {
                console.error("Error processing booking message:", error);
                throw error;
            }
            break;
        default:
            throw new Error("Invalid type");
    }
}

export const receiveSQSMessage = async (type) => {
    let queueUrl;
    switch (type) {
        case "booking":
            queueUrl = process.env.BOOKING_QUEUE_URL;
            break;
        default:
            throw new Error("Invalid type");
    }

    const params = {
        QueueUrl: queueUrl,
        MaxNumberOfMessages: 1,
        WaitTimeSeconds: 20,
    };
    const command = new ReceiveMessageCommand(params);
    try {
        const data = await sqs.send(command);
        if (data.Messages) {
            console.log("Message received successfully", data);
            for (const msg of data.Messages) {
                const body = JSON.parse(msg.Body);
                console.log(`[${type}] Processing:`, body);

                await processMessageByType(type, body);

                await deleteSQSMessage(type, msg.ReceiptHandle);
            }
        }
        return true;
    } catch (error) {
        console.log("Error receiving message", error);
        return false;
    }
}
