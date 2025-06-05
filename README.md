# EYIF 2025 Server

Backend server for the Edo Youth Impact Forum (EYIF) 2025 website. This server handles form submissions including contact forms, newsletter subscriptions, and grant applications.

## Features

- Contact form processing
- Newsletter subscription management
- Grant application submissions
- Email notifications for administrators
- Confirmation emails for users

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Gmail account for sending emails

## Setup

1. Clone the repository

   ```
   git clone [repository-url]
   cd eyif-server
   ```

2. Install dependencies

   ```
   npm install
   ```

   or

   ```
   yarn install
   ```

3. Create a `.env` file based on the `.env.example` file

   ```
   cp .env.example .env
   ```

4. Update the `.env` file with your credentials:

   - `EMAIL`: Your Gmail address
   - `EMAIL_PASSWORD`: Your Gmail app password (see note below)
   - `WEBSITE_URL`: Your website URL
   - `CONTACT_EMAIL`: Email where contact form submissions will be sent
   - `NEWSLETTER_EMAIL`: Email where newsletter subscriptions will be sent
   - `GRANT_EMAIL`: Email where grant applications will be sent
   - `SEAT_RESERVATION_EMAIL`: Email where seat reservation notifications will be sent
   - `MONGODB_URI`: Your MongoDB connection string (e.g., mongodb+srv://user:password@cluster.mongodb.net/dbname)

   **Note:** For `EMAIL_PASSWORD`, you need to use an App Password if you have 2-Factor Authentication enabled on your Google account. You can generate this from your Google Account settings.

5. Add your logo:
   - Place your logo file in the `assets` directory and name it `logo.png`

## Running the Server

### Development Mode

```
npm run dev
```

or

```
yarn dev
```

### Production Mode

```
npm start
```

or

```
yarn start
```

## API Endpoints

### Contact Form

- **URL**: `/contact`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "firstName": "John",
    "lastName": "Doe",
    "email": "johndoe@example.com",
    "phone": "+2341234567890",
    "message": "Hello, I would like more information about EYIF 2025."
  }
  ```

### Newsletter Subscription

- **URL**: `/subscribe`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "email": "johndoe@example.com"
  }
  ```

### Grant Registration

- **URL**: `/grant-registration`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "fullName": "John Doe",
    "email": "johndoe@example.com",
    "phone": "+2341234567890",
    "startupName": "EcoTech Solutions",
    "category": "waste-environment",
    "ideaSummary": "A solution for recycling plastic waste...",
    "problemStatement": "Plastic pollution is a growing problem...",
    "fundUsage": "The funds will be used to develop a prototype...",
    "otherCategory": "If category is 'other', specify the category here"
  }
  ```
- **Categories**:
  - `basic-education`
  - `agriculture-food`
  - `waste-environment`
  - `culture-arts`
  - `skills-work`
  - `other` (If 'other', an additional 'otherCategory' field is required in the request body)

### Seat Reservation

- **URL**: `/reserve-seat`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "firstName": "John",
    "lastName": "Doe",
    "email": "johndoe@example.com",
    "phone": "+2341234567890"
  }
  ```

On success, the user will receive a confirmation email and the admin (configured via `SEAT_RESERVATION_EMAIL` in your `.env`) will be notified of the reservation.

## License

ISC
