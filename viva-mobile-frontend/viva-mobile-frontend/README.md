# VIVA Mobile Frontend

This project is a mobile application designed to work with the VIVA Vision API powered by FastAPI. It includes features for visually impaired users, such as voice feedback for responses, speech input via microphone, and camera access to describe the environment.

## Project Structure

```
viva-mobile-frontend
├── public
│   ├── index.html        # Main HTML document for the mobile application
│   └── favicon.ico       # Favicon for the application
├── src
│   ├── css
│   │   └── style.css     # CSS styles for the application
│   ├── js
│   │   └── main.js       # JavaScript code for user interactions
│   └── assets            # Directory for additional assets
└── README.md             # Documentation for the project
```

## Features

- **Voice Feedback**: The application provides audio responses to user queries, enhancing accessibility for visually impaired users.
- **Speech Input**: Users can input questions using their voice through a microphone button.
- **Camera Access**: A button allows users to capture images for analysis, enabling the application to describe the environment.

## Setup Instructions

1. **Clone the Repository**:
   ```
   git clone <repository-url>
   cd viva-mobile-frontend
   ```

2. **Open the Project**:
   Open the project in your preferred code editor.

3. **Run the Application**:
   You can use a local server to run the application. For example, you can use the Live Server extension in VS Code or any other local server setup.

4. **Access the Application**:
   Open your browser and navigate to `http://localhost:PORT` (replace `PORT` with the port number used by your local server).

## Usage Guidelines

- Use the microphone button to ask questions to the VIVA assistant.
- Press the camera button to capture an image for analysis.
- The application will provide audio feedback for responses.

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for any suggestions or improvements.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.