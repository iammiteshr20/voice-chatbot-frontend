import { useState } from "react";
import Title from "./Title";
import axios from "axios";
import RecordMessage from "./RecordMessage";
import RecordIcon from "./RecordIcon";

const apiUrl = import.meta.env.VITE_API_URL;

const Controller = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [active, setActive] = useState(false);

  function createBlobURL(data: any) {
    const blob = new Blob([data], { type: "audio/mpeg" });
    const url = window.URL.createObjectURL(blob);
    return url;
  }

  function convertToAMPM(time24: string): string {
    const splitTime: string[] = time24.split(':');
    let hours: number = parseInt(splitTime[0]);
    const minutes: number = parseInt(splitTime[1]);

    const ampm: string = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12; // Handle midnight (00:00)

    const formattedTime: string = hours + ':' + (minutes < 10 ? '0' + minutes : minutes) + ' ' + ampm;
    return formattedTime;
  }

  const handleStart = async () => {
    setActive(true)
    await axios
      .get(`${apiUrl}welcome-doctor`, {
        headers: {
          "Content-Type": "application/json",
        },
      })
      .then((res: any) => {
        const messagesArr = [...messages];

        // Append to audio
        const rachelMessage = { sender: "rachel", text: res.data.message, url: res.data.result_audio_path };
        messagesArr.push(rachelMessage);
        setMessages(messagesArr);

        // Play audio
        setIsLoading(false);
      })
      .catch((err: any) => {
        console.error(err);
        setIsLoading(false);
      });
  }

  const handleStop = async (blobUrl: string) => {
    setIsLoading(true);

    // Append recorded message to messages
    // const myMessage = { sender: "me", blobUrl };
    // const messagesArr = [...messages, myMessage];

    // convert blob url to blob object
    fetch(blobUrl)
      .then((res) => res.blob())
      .then(async (blob) => {
        // Construct audio to send file
        const formData = new FormData();
        formData.append("file", blob, "myFile.wav");

        // send form data to api endpoint
        await axios
          .post(`${apiUrl}voice-chat/book-appointment`, formData, {
            headers: {
              "Content-Type": "audio/mpeg",
            },
            // responseType: "arraybuffer", // Set the response type to handle binary data
          })
          .then((res: any) => {
            // Append recorded message to messages
            const myMessage = { sender: "me", text: res.data.transcription };
            const messagesArr = [...messages, myMessage];

            // Append to audio
            const rachelMessage = { sender: "rachel", text: res.data.booking_result.message, url: res.data.result_audio_path, alternatives: res.data.booking_result.alternatives ? res.data.booking_result.alternatives :[]};
            messagesArr.push(rachelMessage);
            setMessages(messagesArr);

            // Play audio
            setIsLoading(false);
          })
          .catch((err: any) => {
            console.error(err);
            setIsLoading(false);
          });
      });
  };

  return (
    <div className="h-screen overflow-y-hidden">
      {/* Title */}
      <Title setMessages={setMessages} />

      <div className="flex flex-col justify-between h-full overflow-y-scroll pb-96">
        {/* Conversation */}
        <div className="mt-5 px-5">
          {messages?.map((audio, index) => {
            return (
              <div
                key={index + audio.sender}
                className={
                  "flex flex-col " +
                  (audio.sender == "rachel" && "flex items-end")
                }
              >
                {/* Sender */}
                <div className="mt-4 ">
                  <p
                    className={
                      audio.sender == "rachel"
                        ? "text-right mr-2 italic text-green-500"
                        : "ml-2 italic text-blue-500"
                    }
                  >
                    {audio.sender}
                  </p>  
                  <p>
                    {audio.text}
                  </p>
                  {audio?.alternatives && audio.alternatives.length > 0 &&
                    <div>
                      <h2>Availability</h2>
                      <table>
                        <thead>
                          <tr>
                            <th>Day</th>
                            <th>Times</th>
                          </tr>
                        </thead>
                        <tbody>
                        {audio.alternatives.map((item: { day: string; times: string[] }) => (
                          <tr key={item.day}>
                            <td>{item.day}</td>
                            <td>{item.times.map((time: string) => convertToAMPM(time)).join(', ')}</td>
                          </tr>
                        ))}
                        </tbody>
                      </table>
                   </div>
                  }
                  {/* Message */}
                  <audio
                    src={audio.url}
                    style={{
                      visibility: 'hidden'
                    }}
                    controls={false}
                    autoPlay
                  />
                </div>
              </div>
            );
          })}

          {messages.length == 0 && !isLoading && (
            <div className="text-center font-light italic mt-10">
              Talk to Rachel to book an appointment...
            </div>
          )}

          {isLoading && (
            <div className="text-center font-light italic mt-10 animate-pulse">
              Gimme a few seconds...
            </div>
          )}
        </div>

        {/* Recorder */}
        <div className="fixed bottom-0 w-full py-6 border-t text-center bg-gradient-to-r from-sky-500 to-green-500">
          <div className="flex justify-center items-center w-full">
          {active ? (
            <div>
              <RecordMessage handleStop={handleStop} />
            </div>
          ) : (
            <div className="mt-2" onClick={handleStart}>
              <button className="bg-white p-4 rounded-full">
                <RecordIcon
                  classText="text-sky-500"
                />
              </button>
              <p className="mt-2 text-white font-light">start</p>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Controller;
