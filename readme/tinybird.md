<!-- Prerequisits -->

/db/tinybird must have .env.local
this .env.local must have TINYBIRD_TOKEN, TINYBIRD_URL, KAFKA_SERVERS, KAFKA_USERNAME, KAFKA_PASSWORD, KAFKA_REST_URL
Must be in this directory (/packages/db/tinybird) for the below commands.

<!-- First step (Mandatory) -->

tb login

<!-- Command to set secret -->

tb --cloud secret set KAFKA_KEY <KEY>
tb --cloud secret set KAFKA_SERVERS <SERVER>
tb --cloud secret set KAFKA_USERNAME <USERNAME>
tb --cloud secret set KAFKA_PASSWORD <PASSWORD>
tb --cloud secret set --multiline KAFKA_SSL_CA_PEM

(For KAFKA_SSL_CA_PEM --> After entering this command a window will open, there delete all the text and enter the Ca Certificate with no extra spaces and save and close the window.)

<!-- Command to deploy -->

tb --cloud deploy
