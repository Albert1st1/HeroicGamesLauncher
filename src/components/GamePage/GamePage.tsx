import React, { useContext, useEffect, useState } from 'react'
import {
  createNewWindow,
  formatStoreUrl,
  getGameInfo,
  legendary,
  install,
  sendKill,
  importGame,
  launch,
  syncSaves,
  updateGame,
  repair,
  getProgress,
  fixSaveFolder,
  handleStopInstallation,
} from '../../helper'
import Header from '../UI/Header'
// import '../../App.css'
import { AppSettings, Game, GameStatus, InstallProgress } from '../../types'
import ContextProvider from '../../state/ContextProvider'
import { Link, useParams } from 'react-router-dom'
import Update from '../UI/Update'
const { ipcRenderer, remote } = window.require('electron')
const {
  dialog: { showOpenDialog, showMessageBox },
} = remote

// This component is becoming really complex and it needs to be refactored in smaller ones

interface RouteParams {
  appName: string
}

export default function GamePage() {
  const { appName } = useParams() as RouteParams

  const { refresh, libraryStatus, handleGameStatus } = useContext(
    ContextProvider
  )

  const gameStatus: GameStatus = libraryStatus.filter(
    (game: GameStatus) => game.appName === appName
  )[0]

  const { status } = gameStatus || {}

  const [gameInfo, setGameInfo] = useState({} as Game)
  const [progress, setProgress] = useState({
    percent: '0.00%',
    bytes: '0/0MB',
  } as InstallProgress)
  const [installPath, setInstallPath] = useState('default')
  const [autoSyncSaves, setAutoSyncSaves] = useState(false)
  const [savesPath, setSavesPath] = useState('')
  const [isSyncing, setIsSyncing] = useState(false)
  const [clicked, setClicked] = useState(false)

  const isInstalling = status === 'installing'
  const isPlaying = status === 'playing'
  const isUpdating = status === 'updating'
  const isReparing = status === 'repairing'
  const isMoving = status === 'moving'

  useEffect(() => {
    const updateConfig = async () => {
      const newInfo = await getGameInfo(appName)
      setGameInfo(newInfo)
      if (newInfo.cloudSaveEnabled) {
        ipcRenderer.send('requestSettings', appName)
        ipcRenderer.once(
          appName,
          async (
            event: any,
            { autoSyncSaves, winePrefix, wineVersion }: AppSettings
          ) => {
            const isProton = wineVersion.name.includes('Proton')
            setAutoSyncSaves(autoSyncSaves)
            const folder = await fixSaveFolder(
              newInfo.saveFolder,
              winePrefix,
              isProton
            )
            setSavesPath(folder)
          }
        )
      }
    }
    updateConfig()
  }, [isInstalling, isPlaying, appName])

  useEffect(() => {
    const progressInterval = setInterval(() => {
      if (isInstalling || isUpdating || isReparing) {
        ipcRenderer.send('requestGameProgress', appName)
        ipcRenderer.on(
          `${appName}-progress`,
          (event: any, progress: InstallProgress) => {
            setProgress(progress)

            handleGameStatus({
              appName,
              status,
              progress: getProgress(progress),
            })
          }
        )
      }
    }, 500)
    return () => clearInterval(progressInterval)
  }, [isInstalling, isUpdating, appName, isReparing])

  if (gameInfo) {
    const {
      title,
      art_square,
      art_logo,
      install_path,
      install_size,
      isInstalled,
      version,
      extraInfo,
      developer,
      cloudSaveEnabled,
    }: Game = gameInfo

    if (savesPath.includes('{InstallDir}')) {
      setSavesPath(savesPath.replace('{InstallDir}', install_path))
    }
    const protonDBurl = `https://www.protondb.com/search?q=${title}`

    return (
      <div className="gamePage">

        {/* left container */}
        <div className="leftContent">
          <div className="navbar">
            <div className="navbar-item backArrow">
              <a className="icon is-active">
                <i className="mdi mdi-24px mdi-arrow-left"></i>
              </a>
            </div>
            <div className="navbar-item gameName has-text-primary is-size-4">
              {title}
            </div>
          </div>

          <div className="controls">
            <button className="button is-success is-uppercase has-text-dark">play</button>
            {cloudSaveEnabled && (
              <div
                style={{
                  color: autoSyncSaves ? '#07C5EF' : '',
                }}
              >
                Sync Saves: {autoSyncSaves ? 'Enabled' : 'Disabled'}
              </div>
            )}
            <span className="links">
              <a href="protonDBurl" className="icon-text proton">
                <span className="has-text-grey-lighter">ProtonDB</span>
                <span className="icon has-text-primary ">
                  <i className="mdi mdi-open-in-new"></i>
                </span>
              </a>
              <a href="" className="icon-text epic">
                <span className="has-text-grey-lighter">Epic Store</span>
                <span className="icon has-text-primary ">
                  <i className="mdi mdi-open-in-new"></i>
                </span>
              </a>
            </span>
          </div>

          <div className="navbar-divider"></div>

          <div className="readOnly">
            <div className="tagline">Version</div>
            <div className="version">{version}</div>
            <span className="tagline">Location</span>
            <span className="location">{install_path}</span>
            <div className="tagline">Size</div>
            <div className="size">{install_size}</div>
          </div>


          <div className="navbar-divider"></div>
            
          <div className="gameSettings">
            <div className="tagline">Wine Prefix</div>
            <div className="prefix">insert prefix location here</div>
            <div className="tagline">Wine Version</div>
            <div className="wineVersion">insert wine/proton choice dropdown here</div>
          </div>

          <div className="wineExtra links">
              <a href="protonDBurl" className="icon-text cfg">
                <span className="has-text-grey-lighter">WineCFG</span>
                <span className="icon has-text-primary ">
                  <i className="mdi mdi-open-in-new"></i>
                </span>
              </a>
              <a href="" className="icon-text tricks">
                <span className="has-text-grey-lighter">Winetricks</span>
                <span className="icon has-text-primary ">
                  <i className="mdi mdi-open-in-new"></i>
                </span>
              </a>
            </div>
            
            <div className="uninstallWrap">
              <button className="button uninstall has-text-danger is-uppercase is-dark">Uninstall</button>
            </div>

        </div>

        {/* image on right */}
        
        {/* <figure className="image is-square gameImage">
          <img src={art_square}/>
        </figure> */}


        {/* gradient over image */}






{/* old junk */}
        {/* <div className="gameConfigContainer">
          {title ? (
            <>
              <span
                onClick={() => setClicked(!clicked)}
                className="material-icons is-secondary dots"
              >
                more_vertical
              </span>
              <div className={`more ${clicked ? 'clicked' : ''}`}>
                {isInstalled && (
                  <>
                    <Link
                      className="hidden link"
                      to={{
                        pathname: `/settings/${appName}/wine`,
                      }}
                    >
                      Settings
                    </Link>
                    <span
                      onClick={() => handleRepair(appName)}
                      className="hidden link"
                    >
                      Verify and Repair
                    </span>{' '}
                    <span
                      onClick={() => handleMoveInstall()}
                      className="hidden link"
                    >
                      Move Game
                    </span>{' '}
                    <span
                      onClick={() => ipcRenderer.send('getLog', appName)}
                      className="hidden link"
                    >
                      Latest Log
                    </span>
                  </>
                )}
                <span
                  onClick={() => createNewWindow(formatStoreUrl(title))}
                  className="hidden link"
                >
                  Store Page
                </span>
                <span
                  onClick={() => createNewWindow(protonDBurl)}
                  className="hidden link"
                >
                  Check Compatibility
                </span>
              </div>
              <div className="gameConfig">
                <div className="gamePicture">
                  <img alt="cover-art" src={art_square} className="gameImg" />
                  {art_logo && (
                    <img alt="cover-art" src={art_logo} className="gameLogo" />
                  )}
                </div>
                <div className="gameInfo">
                  <div className="title">{title}</div>
                  <div className="infoWrapper">
                    <div className="developer">{developer}</div>
                    <div className="summary">
                      {extraInfo ? extraInfo.shortDescription : ''}
                    </div>
                    {cloudSaveEnabled && (
                      <div
                        style={{
                          color: autoSyncSaves ? '#07C5EF' : '',
                        }}
                      >
                        Sync Saves: {autoSyncSaves ? 'Enabled' : 'Disabled'}
                      </div>
                    )}
                    {isInstalled && (
                      <>
                        <div>Size: {install_size}</div>
                        <div>Version: {version}</div>
                        <div
                          className="clickable"
                          onClick={() =>
                            ipcRenderer.send('openFolder', install_path)
                          }
                        >
                          Location: {install_path}
                        </div>
                        <br />
                      </>
                    )}
                  </div>
                  <div className="gameStatus">
                    {isInstalling && (
                      <progress
                        className="installProgress"
                        max={100}
                        value={getProgress(progress)}
                      />
                    )}
                    <p
                      style={{
                        fontStyle: 'italic',
                        color:
                          isInstalled || isInstalling ? '#0BD58C' : '#BD0A0A',
                      }}
                    >
                      {getInstallLabel(isInstalled)}
                    </p>
                  </div>
                  {!isInstalled && !isInstalling && (
                    <select
                      onChange={(event) => setInstallPath(event.target.value)}
                      value={installPath}
                      className="settingSelect"
                    >
                      <option value={'default'}>Install on default Path</option>
                      <option value={'another'}>Install on another Path</option>
                      <option value={'import'}>Import Game</option>
                    </select>
                  )}
                  <div className="buttonsWrapper">
                    {isInstalled && (
                      <>
                        <button
                          disabled={isReparing || isMoving}
                          onClick={handlePlay()}
                          className={`button ${getPlayBtnClass()}`}
                        >
                          {getPlayLabel()}
                        </button>
                      </>
                    )}
                    <button
                      onClick={handleInstall(isInstalled)}
                      disabled={
                        isPlaying || isUpdating || isReparing || isMoving
                      }
                      className={`button ${getButtonClass(isInstalled)}`}
                    >
                      {`${getButtonLabel(isInstalled)}`}
                    </button>
                  </div>
                </div>
              </div>{' '}
            </>
          ) : (
            <Update />
          )}
        </div> */}
      </div>
    )
  }
  return null

  function getPlayBtnClass() {
    if (isUpdating) {
      return 'is-danger'
    }
    if (isSyncing) {
      return 'is-primary'
    }
    return isPlaying ? 'is-tertiary' : 'is-success'
  }

  function getPlayLabel(): React.ReactNode {
    if (isUpdating) {
      return 'Cancel Update'
    }
    if (isSyncing) {
      return 'Syncinc Saves'
    }

    return isPlaying ? 'Playing (Stop)' : 'Play Now'
  }

  function getInstallLabel(isInstalled: boolean): React.ReactNode {
    const { eta, percent } = progress
    if (isReparing) {
      return `Repairing Game ${percent ? `${percent}` : '...'}`
    }

    if (isMoving) {
      return `Moving Installation, please wait.`
    }

    if (isUpdating && isInstalling) {
      return `Updating ${percent ? `${percent} | ETA: ${eta}` : '...'}`
    }

    if (!isUpdating && isInstalling) {
      return `Installing ${percent ? `${percent} | ETA: ${eta}` : '...'}`
    }

    if (isInstalled) {
      return 'Installed'
    }

    return 'This game is not installed'
  }

  function getButtonClass(isInstalled: boolean) {
    if (isInstalled || isInstalling) {
      return 'is-danger'
    }
    return 'is-primary'
  }

  function getButtonLabel(isInstalled: boolean) {
    if (installPath === 'import') {
      return 'Import'
    }
    if (isInstalled) {
      return 'Uninstall'
    }
    if (isInstalling) {
      return 'Cancel'
    }
    return 'Install'
  }

  function handlePlay() {
    return async () => {
      if (status === 'playing' || status === 'updating') {
        handleGameStatus({ appName, status: 'done' })
        return sendKill(appName)
      }

      if (autoSyncSaves) {
        setIsSyncing(true)
        await syncSaves(savesPath, appName)
        setIsSyncing(false)
      }

      handleGameStatus({ appName, status: 'playing' })
      await launch(appName).then(async (err: string | string[]) => {
        if (!err) {
          return
        }
        if (err.includes('ERROR: Game is out of date')) {
          const { response } = await showMessageBox({
            title: 'Game Needs Update',
            message: 'This game has an update, do you wish to update now?',
            buttons: ['YES', 'NO'],
          })

          if (response === 0) {
            handleGameStatus({ appName, status: 'updating' })
            await updateGame(appName)
            return handleGameStatus({ appName, status: 'done' })
          }
          handleGameStatus({ appName, status: 'playing' })
          await launch(`${appName} --skip-version-check`)
          return handleGameStatus({ appName, status: 'done' })
        }
      })

      if (autoSyncSaves) {
        setIsSyncing(true)
        await syncSaves(savesPath, appName)
        setIsSyncing(false)
      }

      return handleGameStatus({ appName, status: 'done' })
    }
  }

  function handleInstall(isInstalled: boolean): any {
    return async () => {
      if (isInstalling) {
        const { folderName } = await getGameInfo(appName)
        return handleStopInstallation(appName, [installPath, folderName])
      }

      if (isInstalled) {
        handleGameStatus({ appName, status: 'uninstalling' })
        await legendary(`uninstall ${appName}`)
        handleGameStatus({ appName, status: 'done' })
        return refresh()
      }

      if (installPath === 'default') {
        const path = 'default'
        handleGameStatus({ appName, status: 'installing' })
        await install({ appName, path })
        // Wait to be 100% finished
        return setTimeout(() => {
          handleGameStatus({ appName, status: 'done' })
        }, 1000)
      }

      if (installPath === 'import') {
        const { filePaths } = await showOpenDialog({
          title: 'Choose Game Folder to import',
          buttonLabel: 'Choose',
          properties: ['openDirectory'],
        })

        if (filePaths[0]) {
          const path = filePaths[0]
          handleGameStatus({ appName, status: 'installing' })
          await importGame({ appName, path })
          return handleGameStatus({ appName, status: 'done' })
        }
      }

      if (installPath === 'another') {
        const { filePaths } = await showOpenDialog({
          title: 'Choose Install Path',
          buttonLabel: 'Choose',
          properties: ['openDirectory'],
        })

        if (filePaths[0]) {
          const path = filePaths[0]
          handleGameStatus({ appName, status: 'installing' })
          setInstallPath(path)
          await install({ appName, path })
          // Wait to be 100% finished
          return setTimeout(() => {
            handleGameStatus({ appName, status: 'done' })
          }, 1000)
        }
      }
    }
  }

  async function handleMoveInstall() {
    const { response } = await showMessageBox({
      title: 'Move Game Installation',
      message: 'This can take a long time, are you sure?',
      buttons: ['YES', 'NO'],
    })
    if (response === 0) {
      handleGameStatus({ appName, status: 'moving' })
      await ipcRenderer.invoke('moveInstall', appName)
      handleGameStatus({ appName, status: 'done' })
    }
    return
  }

  async function handleRepair(appName: string) {
    const { response } = await showMessageBox({
      title: 'Verify and Repair',
      message:
        'Do you want to try to repair this game. It can take a long time?',
      buttons: ['YES', 'NO'],
    })

    if (response === 1) {
      return
    }

    handleGameStatus({ appName, status: 'repairing' })
    await repair(appName)
    return handleGameStatus({ appName, status: 'done' })
  }
}
