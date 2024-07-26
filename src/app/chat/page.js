"use client";
import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
});

// Function to get chat completion from Groq
const getGroqChatCompletion = async (messages) => {
  return groq.chat.completions.create({
    messages,
    model: "llama3-8b-8192",
    temperature: 0.5,
    max_tokens: 1024,
    top_p: 1,
    stop: null,
    stream: false,
  });
};

const splitTextAfterPeriods = (text, maxLength = 500) => {
  const sentences = text.split(/(?<=\.)\s+/); // Split by periods followed by a space
  const paragraphs = [];
  let currentParagraph = "";

  sentences.forEach((sentence) => {
    if ((currentParagraph + sentence).length <= maxLength) {
      currentParagraph += (currentParagraph ? " " : "") + sentence;
    } else {
      if (currentParagraph) {
        paragraphs.push(currentParagraph.trim());
      }
      currentParagraph = sentence;
    }
  });

  if (currentParagraph) {
    paragraphs.push(currentParagraph.trim());
  }

  return paragraphs;
};

const Chat = () => {
  const searchParams = useSearchParams();
  const search = searchParams.get("messagefromquery");

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (search) {
      setMessages([{ role: "user", content: decodeURIComponent(search) }]);
      sendMessage(search);
    }
  }, [search]);

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      sendMessage(input);
    }
  };

  const sendMessage = async (messageContent) => {
    if (!messageContent.trim()) return;

    const newMessage = { role: "user", content: messageContent };
    setMessages([...messages, newMessage]);
    setInput("");
    setLoading(true);

    try {
      // Prepare messages for Groq API
      const groqMessages = [
        {
          role: "system",
          content:
            "You are a helpful Medical Research Assistant. You should answer questions only related to medical research. You should not answer programming questions.",
        },
        ...[...messages, newMessage].map((message) => ({
          role: message.role === "user" ? "user" : "assistant",
          content: message.content,
        })),
      ];

      const result = await getGroqChatCompletion(groqMessages);
      console.log(result);
      const botMessage = {
        role: "assistant",
        content: result.choices[0]?.message?.content || "",
      };
      setMessages([...messages, newMessage, botMessage]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false); // Ensure loading is set to false in case of success or error
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 flex flex-col">
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.map((message, index) => {
          const paragraphs = splitTextAfterPeriods(message.content);
          return (
            <div
              key={index}
              className={`p-4 rounded-lg ${
                message.role === "user"
                  ? "bg-blue-100 self-end"
                  : "bg-gray-100 self-start"
              }`}
            >
              <span className="font-bold">
                {message.role === "user"
                  ? "User:"
                  : "Medical Research Assistant:"}
              </span>
              {paragraphs.map((para, i) => (
                <p key={i} className="mt-2">
                  {para}
                </p>
              ))}
            </div>
          );
        })}
        {loading && (
          <div className="flex">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              x="0px"
              y="0px"
              width="48"
              height="48"
              viewBox="0 0 48 48"
            >
              <linearGradient
                id="w17wr4HO9wItDezz_rq6ha_ka3InxFU3QZa_gr1"
                x1="3.842"
                x2="46.225"
                y1="4.692"
                y2="45.288"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0" stop-color="#32de9f"></stop>
                <stop offset="1" stop-color="#0ea982"></stop>
              </linearGradient>
              <path
                fill="url(#w17wr4HO9wItDezz_rq6ha_ka3InxFU3QZa_gr1)"
                d="M40,6H8C6.895,6,6,6.895,6,8v32c0,1.105,0.895,2,2,2h32c1.105,0,2-0.895,2-2V8	C42,6.895,41.105,6,40,6z"
              ></path>
              <path
                d="M37.599,24.232c-0.314-1.173-0.922-2.245-1.765-3.12c0.647-1.78,0.48-3.782-0.466-5.422	c-0.961-1.664-2.512-2.854-4.368-3.352c-0.606-0.162-1.229-0.244-1.852-0.244c-0.584,0-1.167,0.072-1.736,0.214	C26.193,10.857,24.377,10,22.487,10c-3.222,0-6.012,2.116-6.901,5.188c-1.893,0.331-3.504,1.455-4.467,3.122	c-0.961,1.663-1.216,3.602-0.719,5.458c0.315,1.176,0.923,2.248,1.767,3.122c-0.647,1.78-0.481,3.782,0.464,5.419	c0.961,1.664,2.512,2.854,4.368,3.352c0.614,0.164,1.244,0.248,1.872,0.248c0.563,0,1.139-0.074,1.715-0.219	c1.228,1.473,3.005,2.31,4.926,2.31c3.227,0,6.019-2.121,6.905-5.198c1.889-0.328,3.503-1.448,4.463-3.112	C37.842,28.026,38.097,26.088,37.599,24.232z M28.849,23.785l1.571,0.884v6.138c0,2.706-2.202,4.908-4.908,4.908	c-0.99,0-1.938-0.354-2.683-0.986l5.524-3.189c0.357-0.207,0.576-0.591,0.571-1.002L28.849,23.785z M15.876,24.996l5.886,3.311	l-1.552,0.919l-5.315-3.069c-1.135-0.655-1.948-1.713-2.287-2.98c-0.339-1.266-0.165-2.589,0.491-3.724	c0.502-0.869,1.268-1.503,2.195-1.828V24C15.294,24.411,15.517,24.793,15.876,24.996z M14.125,28.351l5.523,3.189	c0.173,0.1,0.371,0.153,0.571,0.153c0.205,0,0.406-0.055,0.583-0.16l5.811-3.442l0.02,1.803l-5.316,3.069	c-0.748,0.432-1.593,0.661-2.445,0.661c-0.429,0-0.86-0.057-1.28-0.17c-1.266-0.339-2.324-1.151-2.98-2.286	C14.118,30.311,13.95,29.313,14.125,28.351z M21.419,22.548l2.548-1.509l2.582,1.452l0.033,2.961l-2.548,1.509l-2.582-1.452	L21.419,22.548z M19.151,24.215l-1.571-0.884v-6.138c0-2.706,2.202-4.908,4.908-4.908c0.99,0,1.939,0.353,2.684,0.985l-5.525,3.189	c-0.357,0.207-0.576,0.591-0.571,1.002L19.151,24.215z M32.124,23.004l-5.886-3.311l1.552-0.919l5.315,3.069	c1.135,0.655,1.948,1.713,2.287,2.98c0.339,1.266,0.165,2.589-0.491,3.724c-0.495,0.858-1.275,1.503-2.195,1.832V24	C32.706,23.589,32.483,23.207,32.124,23.004z M33.873,19.647l-5.519-3.187c-0.174-0.1-0.371-0.152-0.571-0.152	c-0.204,0-0.405,0.055-0.581,0.158l-5.813,3.443l-0.02-1.803l5.316-3.069c0.748-0.432,1.593-0.66,2.446-0.66	c0.429,0,0.859,0.057,1.279,0.169c1.265,0.339,2.323,1.151,2.979,2.286C33.881,17.686,34.048,18.684,33.873,19.647z"
                opacity=".07"
              ></path>
              <path
                d="M38.082,24.102c-0.31-1.156-0.885-2.22-1.679-3.112c0.578-1.842,0.366-3.872-0.602-5.55	c-1.028-1.78-2.687-3.053-4.671-3.585c-0.648-0.173-1.315-0.261-1.981-0.261c-0.523,0-1.044,0.054-1.557,0.161	C26.284,10.332,24.422,9.5,22.487,9.5c-3.343,0-6.252,2.13-7.291,5.256c-1.913,0.422-3.526,1.599-4.51,3.304	c-1.028,1.779-1.301,3.852-0.768,5.838c0.31,1.158,0.887,2.223,1.681,3.114c-0.578,1.843-0.367,3.872,0.6,5.547	c1.028,1.78,2.687,3.053,4.671,3.585c0.656,0.176,1.33,0.265,2.002,0.265c0.506,0,1.02-0.055,1.535-0.164	c1.312,1.441,3.138,2.255,5.106,2.255c3.347,0,6.258-2.134,7.294-5.265c1.905-0.417,3.524-1.591,4.507-3.295	C38.341,28.16,38.614,26.087,38.082,24.102z M29.359,24.645l0.562,0.316v5.846c0,2.43-1.977,4.408-4.408,4.408	c-0.619,0-1.219-0.157-1.749-0.448l4.841-2.795c0.514-0.298,0.828-0.85,0.821-1.441L29.359,24.645z M19.397,31.973	c0.249,0.144,0.533,0.22,0.821,0.22c0.294,0,0.584-0.079,0.838-0.23l5.066-3.001l0.007,0.645l-5.062,2.922	c-0.672,0.389-1.431,0.594-2.195,0.594c-0.385,0-0.772-0.051-1.15-0.153c-1.137-0.304-2.087-1.034-2.676-2.054	c-0.309-0.535-0.473-1.133-0.487-1.738L19.397,31.973z M15.63,25.431l5.132,2.887l-0.555,0.329l-5.062-2.923	c-1.02-0.589-1.749-1.539-2.054-2.676c-0.304-1.137-0.148-2.325,0.441-3.344c0.314-0.544,0.745-0.982,1.262-1.294V24	C14.794,24.591,15.114,25.14,15.63,25.431z M21.922,22.831l2.051-1.215l2.079,1.169l0.027,2.384l-2.051,1.215l-2.079-1.169	L21.922,22.831z M18.641,23.355l-0.562-0.316v-5.846c0-2.43,1.977-4.408,4.408-4.408c0.619,0,1.219,0.157,1.75,0.447l-4.841,2.795	c-0.514,0.298-0.828,0.85-0.821,1.441L18.641,23.355z M32.37,22.569l-5.132-2.887l0.555-0.329l5.062,2.923	c1.02,0.588,1.749,1.539,2.054,2.676c0.304,1.137,0.148,2.325-0.441,3.344c-0.309,0.536-0.745,0.978-1.262,1.292V24	C33.206,23.409,32.886,22.86,32.37,22.569z M28.603,16.027c-0.251-0.144-0.534-0.219-0.821-0.219c-0.293,0-0.582,0.078-0.834,0.227	l-5.07,3.003l-0.007-0.645l5.062-2.922c0.672-0.388,1.431-0.593,2.196-0.593c0.385,0,0.772,0.051,1.15,0.152	c1.136,0.304,2.086,1.033,2.675,2.053c0.308,0.533,0.471,1.131,0.484,1.737L28.603,16.027z"
                opacity=".05"
              ></path>
              <path
                fill="#fff"
                d="M37.116,24.361c-0.325-1.215-0.976-2.284-1.868-3.126c0.729-1.713,0.619-3.68-0.313-5.295	c-0.894-1.548-2.337-2.656-4.064-3.118c-1.216-0.325-2.468-0.297-3.644,0.057c-1.121-1.49-2.865-2.379-4.739-2.379	c-3.154,0-5.799,2.196-6.503,5.137c-0.006,0.001-0.012-0.002-0.019-0.001c-1.866,0.231-3.474,1.298-4.413,2.924	c-0.894,1.548-1.131,3.352-0.669,5.079c0.326,1.216,0.977,2.286,1.87,3.128c-0.729,1.714-0.624,3.673,0.311,5.293	c0.894,1.548,2.337,2.656,4.064,3.119c0.576,0.154,1.162,0.231,1.743,0.231c0.645,0,1.283-0.104,1.901-0.289	c1.12,1.493,2.858,2.381,4.74,2.381c3.157,0,5.804-2.2,6.506-5.145c1.851-0.225,3.491-1.29,4.43-2.915	C37.342,27.892,37.579,26.088,37.116,24.361z M30.538,14.063c1.396,0.373,2.561,1.269,3.283,2.519	c0.674,1.168,0.799,2.571,0.366,3.836c-0.064-0.04-0.124-0.084-0.189-0.122l-5.894-3.403c-0.201-0.115-0.449-0.114-0.649,0.004	l-6.556,3.883l-0.033-2.962l5.569-3.215C27.685,13.881,29.143,13.691,30.538,14.063z M27.045,22.197l0.04,3.538l-3.045,1.803	l-3.085-1.735l-0.04-3.538l3.045-1.803L27.045,22.197z M17.08,17.193c0-2.982,2.426-5.408,5.408-5.408	c1.356,0,2.631,0.589,3.509,1.599c-0.067,0.036-0.138,0.066-0.204,0.105l-5.895,3.403c-0.201,0.116-0.324,0.332-0.321,0.564	l0.085,7.619l-2.581-1.452L17.08,17.193z M12.125,23.306c-0.373-1.395-0.181-2.853,0.541-4.103c0.681-1.18,1.815-1.976,3.14-2.233	c-0.003,0.075-0.012,0.148-0.012,0.224V24c0,0.232,0.125,0.446,0.328,0.561l6.64,3.735l-2.548,1.509l-5.568-3.216	C13.394,25.868,12.499,24.702,12.125,23.306z M17.462,33.937c-1.396-0.374-2.561-1.269-3.283-2.519	c-0.677-1.173-0.803-2.572-0.368-3.838c0.065,0.041,0.126,0.086,0.192,0.124l5.894,3.403c0.099,0.057,0.21,0.086,0.321,0.086	c0.114,0,0.227-0.03,0.328-0.09l6.556-3.883l0.033,2.962l-5.569,3.215C20.316,34.119,18.858,34.311,17.462,33.937z M30.92,30.807	c0,2.982-2.426,5.408-5.408,5.408c-1.362,0-2.632-0.591-3.509-1.603c0.067-0.036,0.139-0.063,0.206-0.102l5.895-3.403	c0.201-0.116,0.324-0.332,0.321-0.564l-0.086-7.618l2.581,1.452V30.807z M35.334,28.797c-0.679,1.176-1.826,1.984-3.14,2.239	c0.003-0.077,0.012-0.152,0.012-0.229V24c0-0.232-0.125-0.446-0.328-0.561l-6.64-3.735l2.548-1.509l5.568,3.216	c1.251,0.722,2.146,1.888,2.52,3.283C36.248,26.089,36.056,27.547,35.334,28.797z"
              ></path>
            </svg>
            <div className="self-center text-gray-500">Loading...</div>
          </div>
        )}
      </div>
      <div className="sm:flex sm:flex-row flex flex-col sm:space-x-2 mt-4 gap-3">
        
          <input
            className="flex-1  w-full p-2 border rounded-lg"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message here"
            onKeyDown={handleKeyPress}
          />
      
        
          <button
            className="bg-white text-black font-bold px-4 py-2 rounded-lg hover:bg-black hover:text-white"
            onClick={() => sendMessage(input)}
          >
            Send
          </button>
  
      </div>
    </div>
  );
};

export default Chat;