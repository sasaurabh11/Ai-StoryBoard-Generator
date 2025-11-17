import React, { useState } from "react";
import { generateStoryboard } from "./api";

export default function App() {
  const [script, setScript] = useState(`SCENE 1 – GIRL WAKES UP (BEDROOM – MORNING)
The same girl appears in every shot. 
She has shoulder-length black hair (messy at the beginning), medium-fair warm skin tone, slim build, oval face, soft features.  
She wears the same light-pink nightwear in all shots of this scene.
Background stays the same: her soft-lit bedroom with a wooden bed, beige curtains, and a side table.

1. The girl wakes up in bed, sits up slowly, and touches her messy hair.
2. Close-up of her face showing frustration as she sees her tangled hair in her hands.
3. Over-the-shoulder shot of her looking at herself in the bedroom mirror, seeing messy hair.

---

SCENE 2 – BATHROOM HAIR FALL MOMENT (BATHROOM – CONTINUOUS)
Same girl, same facial structure, same nightwear.
Background stays consistent: clean, modern bathroom with white tiles.

1. The girl stands at the bathroom sink, running her fingers through her hair.
2. Close-up of hair strands falling into the sink (hair-fall moment).
3. Close-up on her emotional reaction — concern and worry.

---

SCENE 3 – TALKING TO HER MOM (LIVING ROOM – MORNING)
Same girl, same identity.  
She now wears a simple home outfit: light blue T-shirt.
Her mother appears as a secondary character, middle-aged, kind expression.  
Background stays consistent: neat living room with sofa, window light.

1. The girl sits beside her mom, showing hair-fall strands in her palm.
2. Over-the-shoulder shot of the mom comforting her.
3. Close-up shot of the mom handing her the product “WomenForce Hair Oil”.

---

SCENE 4 – APPLYING WOMENFORCE HAIR OIL (BEDROOM – EVENING)
Same girl, same face.  
Outfit: light-blue T-shirt continues (to maintain consistency).  
Background returns to her bedroom from Scene 1.

1. The girl applies WomenForce hair oil gently to her hair.
2. Close-up: oil being massaged onto the scalp.
3. Close-up: her relaxed, relieved expression.

---

SCENE 5 – RESULTS & CONFIDENCE (NEXT MORNING – BEDROOM)
Same girl, same face, same hairstyle but now smooth, shiny, healthier.
Outfit: same light-blue T-shirt.
Background: same bedroom for perfect continuity.

1. The girl looks into the mirror smiling, running fingers through her stronger hair.
2. Close-up: smooth healthy hair with shine.
3. Hero shot: she holds WomenForce Hair Oil confidently with a bright smile.

END.`);
  const [charDesc, setCharDesc] = useState(
    "A young woman in her early 20s, shoulder-length black hair, medium-fair warm skin tone,oval-soft facial structure, slim build, expressive eyes, consistent identity across scenes."
  );
  const [seed, setSeed] = useState(42);
  const [cols, setCols] = useState(3);
  const [loading, setLoading] = useState(false);
  const [storyboardImg, setStoryboardImg] = useState(null);
  const [referenceImg, setReferenceImg] = useState(null);
  const [shots, setShots] = useState([]);
  const [shotsMeta, setShotsMeta] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("shots");
  const [selectedShot, setSelectedShot] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  function b64toSrc(b64) {
    return "data:image/png;base64," + b64;
  }

  async function onGenerate() {
    setError(null);
    setLoading(true);
    setStoryboardImg(null);
    setReferenceImg(null);
    setShots([]);
    setSelectedShot(null);
    try {
      const result = await generateStoryboard({
        script,
        character_description: charDesc,
        base_seed: parseInt(seed || 42),
        cols: parseInt(cols || 3),
      });
      setStoryboardImg(b64toSrc(result.storyboard));
      setReferenceImg(b64toSrc(result.reference));
      setShots((result.shots || []).map((b64) => b64toSrc(b64)));
      setShotsMeta(result.shots_meta);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleShotClick(shot, index) {
    setSelectedShot({ src: shot, index });
    setIsModalOpen(true);
  }

  function handlePrevShot() {
    if (selectedShot && shots.length > 0) {
      const newIndex = (selectedShot.index - 1 + shots.length) % shots.length;
      setSelectedShot({ src: shots[newIndex], index: newIndex });
    }
  }

  function handleNextShot() {
    if (selectedShot && shots.length > 0) {
      const newIndex = (selectedShot.index + 1) % shots.length;
      setSelectedShot({ src: shots[newIndex], index: newIndex });
    }
  }

  function handleKeyDown(e) {
    if (isModalOpen) {
      if (e.key === 'ArrowLeft') handlePrevShot();
      if (e.key === 'ArrowRight') handleNextShot();
      if (e.key === 'Escape') setIsModalOpen(false);
    }
  }

  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, selectedShot]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800/80 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">🎬</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Storyboard Generator
                </h1>
                <p className="text-gray-400 text-sm">AI-Powered Visual Storytelling</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 bg-gray-700/50 px-3 py-2 rounded-full border border-gray-600">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-300">Ready to generate</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Input Form */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl shadow-2xl p-6 sticky top-24 border border-gray-700">
              <h2 className="text-xl font-semibold text-white mb-6 pb-4 border-b border-gray-700 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Project Settings
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Script / Ad Brief
                  </label>
                  <textarea
                    value={script}
                    onChange={(e) => setScript(e.target.value)}
                    rows={8}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none text-white placeholder-gray-400 backdrop-blur-sm"
                    placeholder="Enter your script or ad brief here..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Character Description
                  </label>
                  <input
                    value={charDesc}
                    onChange={(e) => setCharDesc(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-white placeholder-gray-400 backdrop-blur-sm"
                    placeholder="Describe the main character..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Base Seed</label>
                    <input
                      type="number"
                      value={seed}
                      onChange={(e) => setSeed(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-white backdrop-blur-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Columns</label>
                    <input
                      type="number"
                      value={cols}
                      onChange={(e) => setCols(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-white backdrop-blur-sm"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    onClick={onGenerate} 
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100 disabled:cursor-not-allowed shadow-lg hover:shadow-xl disabled:shadow-none border border-blue-500/30 flex items-center justify-center group"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating Storyboard...
                      </div>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Generate Storyboard
                      </>
                    )}
                  </button>
                </div>

                {error && (
                  <div className="p-4 bg-red-900/30 border border-red-700 rounded-xl backdrop-blur-sm">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <span className="text-red-300 font-medium">Error: {error}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Results */}
          <div className="lg:col-span-2">
            <div className="space-y-8">
              {/* Reference Character */}
              <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-gray-700">
                <div className="bg-gradient-to-r from-gray-700/50 to-gray-800/50 px-6 py-4 border-b border-gray-700">
                  <h3 className="text-lg font-semibold text-white flex items-center">
                    <svg className="w-5 h-5 mr-2 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Reference Character
                  </h3>
                </div>
                <div className="p-6">
                  {referenceImg ? (
                    <div className="flex justify-center group relative">
                      <img 
                        src={referenceImg} 
                        alt="reference" 
                        className="max-w-sm rounded-xl shadow-2xl border-2 border-gray-600 group-hover:border-blue-500 transition-all duration-300 transform group-hover:scale-105 cursor-pointer"
                      />
                    </div>
                  ) : (
                    <div className="text-center py-16 bg-gray-700/30 rounded-xl border-2 border-dashed border-gray-600 hover:border-gray-500 transition-colors cursor-pointer">
                      <svg className="mx-auto h-16 w-16 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="mt-4 text-gray-400 text-lg">No reference image generated yet</p>
                      <p className="text-gray-500 text-sm mt-2">Generate a storyboard to see the reference character</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Storyboard Composite */}
              <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-gray-700">
                <div className="bg-gradient-to-r from-gray-700/50 to-gray-800/50 px-6 py-4 border-b border-gray-700">
                  <h3 className="text-lg font-semibold text-white flex items-center">
                    <svg className="w-5 h-5 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                    </svg>
                    Storyboard Composite
                  </h3>
                </div>
                <div className="p-6">
                  {storyboardImg ? (
                    <div className="flex justify-center group relative">
                      <img 
                        src={storyboardImg} 
                        alt="storyboard" 
                        className="max-w-full rounded-xl shadow-2xl border-2 border-gray-600 group-hover:border-green-500 transition-all duration-300 cursor-pointer"
                      />
                    </div>
                  ) : (
                    <div className="text-center py-16 bg-gray-700/30 rounded-xl border-2 border-dashed border-gray-600 hover:border-gray-500 transition-colors cursor-pointer">
                      <svg className="mx-auto h-16 w-16 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                      </svg>
                      <p className="mt-4 text-gray-400 text-lg">No storyboard generated yet</p>
                      <p className="text-gray-500 text-sm mt-2">Click generate to create your storyboard</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Results Tabs */}
              <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-gray-700">
                <div className="border-b border-gray-700">
                  <nav className="flex -mb-px">
                    <button
                      onClick={() => setActiveTab("shots")}
                      className={`flex-1 py-4 px-6 text-center font-medium transition-all duration-200 ${
                        activeTab === "shots"
                          ? "text-blue-400 border-b-2 border-blue-400 bg-blue-400/10"
                          : "text-gray-400 hover:text-gray-300 hover:bg-gray-700/50"
                      }`}
                    >
                      Individual Shots
                    </button>
                    <button
                      onClick={() => setActiveTab("metadata")}
                      className={`flex-1 py-4 px-6 text-center font-medium transition-all duration-200 ${
                        activeTab === "metadata"
                          ? "text-purple-400 border-b-2 border-purple-400 bg-purple-400/10"
                          : "text-gray-400 hover:text-gray-300 hover:bg-gray-700/50"
                      }`}
                    >
                      Metadata
                    </button>
                  </nav>
                </div>

                <div className="p-6">
                  {activeTab === "shots" && (
                    <div>
                      {shots.length === 0 ? (
                        <div className="text-center py-16 bg-gray-700/30 rounded-xl border-2 border-dashed border-gray-600">
                          <svg className="mx-auto h-16 w-16 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                          </svg>
                          <p className="mt-4 text-gray-400 text-lg">No shots generated yet</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                          {shots.map((s, i) => (
                            <div 
                              className="shot group cursor-pointer transform hover:scale-105 transition-all duration-300" 
                              key={i}
                              onClick={() => handleShotClick(s, i)}
                            >
                              <div className="relative overflow-hidden rounded-xl border-2 border-gray-600 shadow-lg group-hover:border-blue-500 group-hover:shadow-2xl transition-all duration-300">
                                <img 
                                  src={s} 
                                  alt={`shot ${i + 1}`} 
                                  className="w-full h-48 object-cover"
                                />
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-4">
                                  <div className="text-white font-bold text-lg">Shot {i + 1}</div>
                                  <div className="text-gray-300 text-sm">Click to enlarge</div>
                                </div>
                                <div className="absolute top-3 right-3 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                  #{i + 1}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "metadata" && (
                    <div>
                      {shotsMeta ? (
                        <div className="bg-gray-900/50 rounded-xl border border-gray-700 p-4 max-h-96 overflow-y-auto">
                          <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                            {JSON.stringify(shotsMeta, null, 2)}
                          </pre>
                        </div>
                      ) : (
                        <div className="text-center py-16 bg-gray-700/30 rounded-xl border-2 border-dashed border-gray-600">
                          <svg className="mx-auto h-16 w-16 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p className="mt-4 text-gray-400 text-lg">No metadata available</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Image Modal */}
      {isModalOpen && selectedShot && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors z-10"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={handlePrevShot}
                className="bg-gray-800/50 hover:bg-gray-700/50 text-white p-3 rounded-full transition-all duration-200 transform hover:scale-110 border border-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <div className="relative">
                <img 
                  src={selectedShot.src} 
                  alt={`Shot ${selectedShot.index + 1}`} 
                  className="max-w-full max-h-[80vh] rounded-2xl shadow-2xl border-2 border-gray-600"
                />
                <div className="absolute bottom-4 left-4 bg-black/70 text-white px-4 py-2 rounded-full">
                  Shot {selectedShot.index + 1} of {shots.length}
                </div>
              </div>

              <button
                onClick={handleNextShot}
                className="bg-gray-800/50 hover:bg-gray-700/50 text-white p-3 rounded-full transition-all duration-200 transform hover:scale-110 border border-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <div className="text-center mt-4 text-gray-400 text-sm">
              Use arrow keys to navigate • ESC to close
            </div>
          </div>
        </div>
      )}
    </div>
  );
}