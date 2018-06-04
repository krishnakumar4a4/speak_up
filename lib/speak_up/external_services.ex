defmodule SpeakUp.ExternalServices do
  use GenServer

  def start_link() do
    {:ok, pid} = GenServer.start_link(__MODULE__, [], name: ExternalServices)
    GenServer.cast(pid, :start_services)
    :timer.sleep(5000)
    GenServer.cast(pid, :connect_nodes)
    {:ok, pid}
  end

  def init() do
    {:ok, %{}}
  end

  def handle_cast(:start_services, state) do
    pcmStreamPlayback = spawn_link fn -> System.cmd("node",["app.js","2>","/dev/null"],cd: "../speakup_stream_player/pcm-stream-playback/") end
    speakupStreamPlayer = spawn_link fn -> System.cmd("rebar3",["shell","--name","erlang_speak_up@127.0.0.1", "--config","sys.config"],cd: "../speakup_stream_player/") end
    {:noreply, %{"pcmStreamPlayback" => pcmStreamPlayback, "speakupStreamPlayer" => speakupStreamPlayer}}
#    {:noreply,%{}}
  end

  def handle_cast(:connect_nodes, state) do
    Node.connect(:"erlang_speak_up@127.0.0.1")
    {:noreply, state}
  end
end