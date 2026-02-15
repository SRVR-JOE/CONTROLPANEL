'use client';

import { Volume2, Radio, Cable, ChevronDown } from 'lucide-react';
import { useStore } from '@/store';
import { useState } from 'react';

export default function AudioOutputRouter() {
  const generators = useStore((s) => s.timecodeGenerators);
  const audioOutputs = useStore((s) => s.audioOutputs);
  const setTimecodeAudioOutput = useStore((s) => s.setTimecodeAudioOutput);
  const setTimecodeOutputType = useStore((s) => s.setTimecodeOutputType);
  const [expandedGen, setExpandedGen] = useState<string | null>(generators[0]?.id ?? null);

  const soundcardOutputs = audioOutputs.filter((o) => o.type === 'soundcard');
  const danteOutputs = audioOutputs.filter((o) => o.type === 'dante');

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Audio Output Routing</h2>

      <div className="space-y-3">
        {generators.map((gen) => {
          const isExpanded = expandedGen === gen.id;
          const currentOutput = audioOutputs.find((o) => o.id === gen.audioOutputId);

          return (
            <div key={gen.id} className="glass-card overflow-hidden">
              {/* Header row */}
              <button
                onClick={() => setExpandedGen(isExpanded ? null : gen.id)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-2/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`h-2 w-2 rounded-full ${gen.running ? 'bg-success status-pulse' : 'bg-muted'}`} />
                  <span className="text-sm font-medium text-foreground">{gen.name}</span>
                  <span className="text-xs text-muted">&rarr;</span>
                  <span className="text-sm text-accent">
                    {currentOutput ? currentOutput.name : 'No output'}
                  </span>
                  {currentOutput && (
                    <span className={`rounded px-1.5 py-0.5 text-xs ${
                      currentOutput.type === 'dante' ? 'bg-purple-500/15 text-purple-400' : 'bg-accent/15 text-accent'
                    }`}>
                      {currentOutput.type === 'dante' ? 'Dante' : 'Soundcard'}
                    </span>
                  )}
                </div>
                <ChevronDown className={`h-4 w-4 text-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="border-t border-border px-4 py-4 space-y-4">
                  {/* Output type selector */}
                  <div>
                    <label className="block text-xs text-muted mb-2">Output Protocol</label>
                    <div className="flex gap-2">
                      {(['ltc', 'mtc', 'artnet', 'sacn'] as const).map((type) => (
                        <button
                          key={type}
                          onClick={() => setTimecodeOutputType(gen.id, type)}
                          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                            gen.outputType === type
                              ? 'bg-accent text-white'
                              : 'bg-surface-2 text-muted hover:text-foreground'
                          }`}
                        >
                          {type === 'ltc' ? 'LTC' : type === 'mtc' ? 'MTC' : type === 'artnet' ? 'Art-Net' : 'sACN'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Show audio routing only for LTC (audio-based output) */}
                  {gen.outputType === 'ltc' && (
                    <>
                      {/* Soundcard outputs */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Volume2 className="h-4 w-4 text-accent" />
                          <span className="text-xs font-medium text-foreground">Soundcard Outputs</span>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                          {soundcardOutputs.map((output) => (
                            <button
                              key={output.id}
                              onClick={() => setTimecodeAudioOutput(gen.id, output.id)}
                              className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-left transition-all ${
                                gen.audioOutputId === output.id
                                  ? 'border-accent bg-accent/10'
                                  : 'border-border hover:border-muted'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <Cable className={`h-4 w-4 ${gen.audioOutputId === output.id ? 'text-accent' : 'text-muted'}`} />
                                <div>
                                  <div className="text-sm font-medium text-foreground">{output.name}</div>
                                  <div className="text-xs text-muted">
                                    {output.channels}ch &bull; {output.sampleRate / 1000}kHz
                                    {output.latencyMs !== undefined && ` • ${output.latencyMs}ms`}
                                  </div>
                                </div>
                              </div>
                              <div className={`h-3 w-3 rounded-full border-2 ${
                                gen.audioOutputId === output.id ? 'border-accent bg-accent' : 'border-muted'
                              }`} />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Dante outputs */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Radio className="h-4 w-4 text-purple-400" />
                          <span className="text-xs font-medium text-foreground">Dante Outputs</span>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                          {danteOutputs.map((output) => (
                            <button
                              key={output.id}
                              onClick={() => setTimecodeAudioOutput(gen.id, output.id)}
                              className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-left transition-all ${
                                gen.audioOutputId === output.id
                                  ? 'border-purple-500 bg-purple-500/10'
                                  : 'border-border hover:border-muted'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <Radio className={`h-4 w-4 ${gen.audioOutputId === output.id ? 'text-purple-400' : 'text-muted'}`} />
                                <div>
                                  <div className="text-sm font-medium text-foreground">{output.name}</div>
                                  <div className="text-xs text-muted">
                                    {output.danteDeviceName} &bull; {output.channels}ch &bull; {output.sampleRate / 1000}kHz
                                    {output.latencyMs !== undefined && ` • ${output.latencyMs}ms`}
                                  </div>
                                  {output.danteChannel && (
                                    <div className="text-xs text-purple-400 mt-0.5">
                                      Dante Ch {output.danteChannel}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className={`h-3 w-3 rounded-full border-2 ${
                                gen.audioOutputId === output.id ? 'border-purple-500 bg-purple-500' : 'border-muted'
                              }`} />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* No output option */}
                      <button
                        onClick={() => setTimecodeAudioOutput(gen.id, null)}
                        className={`w-full flex items-center justify-between rounded-lg border px-3 py-2.5 text-left transition-all ${
                          gen.audioOutputId === null
                            ? 'border-warning bg-warning/10'
                            : 'border-border hover:border-muted'
                        }`}
                      >
                        <span className="text-sm text-muted">No audio output (internal only)</span>
                        <div className={`h-3 w-3 rounded-full border-2 ${
                          gen.audioOutputId === null ? 'border-warning bg-warning' : 'border-muted'
                        }`} />
                      </button>
                    </>
                  )}

                  {/* MTC / Art-Net / sACN info */}
                  {gen.outputType === 'mtc' && (
                    <div className="rounded-lg bg-surface-2 p-3">
                      <p className="text-sm text-foreground">MIDI Timecode (MTC)</p>
                      <p className="text-xs text-muted mt-1">
                        Quarter-frame messages sent via MIDI interface. Connect to disguise, QLab, or any MTC-capable device.
                      </p>
                    </div>
                  )}
                  {gen.outputType === 'artnet' && (
                    <div className="rounded-lg bg-surface-2 p-3">
                      <p className="text-sm text-foreground">Art-Net Timecode</p>
                      <p className="text-xs text-muted mt-1">
                        Timecode broadcast over Art-Net protocol. Compatible with lighting consoles, media servers, and show control systems.
                      </p>
                    </div>
                  )}
                  {gen.outputType === 'sacn' && (
                    <div className="rounded-lg bg-surface-2 p-3">
                      <p className="text-sm text-foreground">sACN Timecode</p>
                      <p className="text-xs text-muted mt-1">
                        Streaming ACN timecode output. Used with ETC, Hog, and other sACN-compatible show control systems.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Audio output summary */}
      <div className="glass-card p-4">
        <h3 className="text-sm font-medium text-foreground mb-3">Available Audio Devices</h3>
        <div className="grid grid-cols-2 gap-2">
          {audioOutputs.map((output) => {
            const usedBy = generators.filter((g) => g.audioOutputId === output.id);
            return (
              <div
                key={output.id}
                className={`rounded-lg border px-3 py-2 ${
                  output.active ? 'border-border' : 'border-border/50 opacity-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  {output.type === 'dante' ? (
                    <Radio className="h-3.5 w-3.5 text-purple-400" />
                  ) : (
                    <Volume2 className="h-3.5 w-3.5 text-accent" />
                  )}
                  <span className="text-xs font-medium text-foreground truncate">{output.name}</span>
                </div>
                <div className="text-xs text-muted mt-1">
                  {output.channels}ch &bull; {output.sampleRate / 1000}kHz
                  {!output.active && ' • Inactive'}
                </div>
                {usedBy.length > 0 && (
                  <div className="text-xs text-success mt-1">
                    In use: {usedBy.map((g) => g.name).join(', ')}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
