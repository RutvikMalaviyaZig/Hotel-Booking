import { sqs } from "../config/constant.js";
import { DeleteMessageCommand } from "@aws-sdk/client-sqs";

export const deleteSQSMessage = async (type, receiptHandle) => {
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
        ReceiptHandle: receiptHandle,
    };
    const command = new DeleteMessageCommand(params);
    try {
        const data = await sqs.send(command);
        console.log("Message deleted successfully", data);
        return true;
    } catch (error) {
        console.log("Error deleting message", error);
        return false;
    }
}