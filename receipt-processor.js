/**
 * Receipt Processor API
 */

const express = require('express');
const uuid = require('uuid');

const app = express();
const port = process.env.PORT || 8000;

const receipts = [];

app.use(express.json());
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});

/*
  GET Requests
*/
app.get('/', (req, res) => {
    let info = {
        "title": "Receipt Processor",
        "description": "A simple receipt processor",
        "version": "1.0.0"
    }
    res.json(info);
});

// returns all receipts stored locally
app.get('/receipts', (req, res) => {
    res.json(receipts);
});

/*
 * looks up the receipt by the ID and returns an object specifying the points awarded
 * @returns {object} JSON of points assigned to the receipt
 */
app.get('/receipts/:id', (req, res) => {
    const id = req.params.id;
    const receipt = receipts.find((receipt) => receipt.id === id);

    if (!receipt) {
        return res.status(404).json({ error: 'No receipt found for that ID' });
    }

    res.json({ "points": receipt["points"] });
});

/*
  POST Requests
 */

/*
 * Submits a receipt for processing
 * @returns {object} JSON of ID assigned to the receipt
 */
app.post('/receipts/process', (req, res) => {
    const receipt = req.body;

    if (!receipt) {
        return res.status(400).json({ error: 'Receipt not found' });
    }

    if (!receipt.retailer || !receipt.purchaseDate || !receipt.purchaseTime || !receipt.items || !receipt.total) {
        return res.status(400).json({ error: 'The receipt is invalid' });
    }

    try {
        const points = calculatePoints(receipt)
        const id = uuid.v4()

        const newReceipt = {
            "id": id,
            "points": points
        }

        receipts.push(newReceipt);
        res.status(200).json({ "id": id });
    } catch (error) {
        res.status(500).json({ error: 'Error processing receipt: ' + error });
    }
});

/*
 * Calculates number of points a receipt should be rewarded
 * @param {object} receipt
 * @returns {number} calculated points
 */
function calculatePoints(receipt) {
    let points = 0;

    // One point for every alphanumeric character in the retailer name
    const retailer = receipt["retailer"];
    points += retailer.replace(/[^0-9a-z]/gi, '').length;

    // 50 points if the total is a round dollar amount with no cents
    const total = receipt["total"];
    if (Math.floor(total) == total) {
        points += 50;
    }
    // 25 points if the total is a multiple of 0.25
    if (total % 0.25 === 0) {
        points += 25;
    }

    // 5 points for every two items on the receipt
    const items = receipt["items"]
    points += Math.floor(items.length / 2) * 5

    // points on item description based on multiple of 3
    for (let i = 0; i < items.length; i++) {
        if (!items[i].hasOwnProperty("shortDescription") || !items[i].hasOwnProperty("price")) {
            throw new Error(`Validation failed: Item at index ${i} does not have the required fields.`);
        }

        const description = items[i]["shortDescription"].trim();
        if (description.length % 3 === 0) {
            const price = items[i]["price"]
            points += Math.ceil(price * 0.2)
        }
    }

    // 6 points if the day in the purchase date is odd
    const purchaseDate = receipt["purchaseDate"]
    const lastValue = Number(purchaseDate.slice(-1))
    if (lastValue % 2 === 1) {
        points += 6
    }

    // 10 points if the time of purchase is after 2:00pm and before 4:00pm
    const [hours, minutes] = receipt["purchaseTime"].split(":").map(Number)
    if ((hours > 14 || (hours === 14 && minutes > 0)) && (hours < 16)) {
        points += 10
    }

    return points
}