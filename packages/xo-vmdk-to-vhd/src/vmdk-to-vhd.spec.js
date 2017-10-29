'use strict'

import {describe, it} from 'mocha'
import {exec} from 'child-process-promise'
import {createReadStream, createWriteStream} from 'fs-promise'

import {readRawContent} from './vmdk-read'
import {VHDFile, convertFromVMDK, computeGeometryForSize} from './vhd-write'

describe('VMDK to VHD conversion', () => {
  it('can convert a random data file with readRawContent()', async () => {
    let inputRawFileName = 'random-data.raw'
    let vmdkFileName = 'random-data.vmdk'
    let vhdFileName = 'from-vmdk-readRawContent.vhd'
    let reconvertedRawFilemane = 'from-vhd.raw'
    let dataSize = 5222400
    await exec('rm -f ' + [inputRawFileName, vmdkFileName, vhdFileName, reconvertedRawFilemane].join(' '))
    await exec('base64 /dev/urandom | head -c ' + dataSize + ' > ' + inputRawFileName)
    await exec('VBoxManage convertfromraw --format VMDK --variant Stream ' + inputRawFileName + ' ' + vmdkFileName)
    const rawContent = (await readRawContent(createReadStream(vmdkFileName))).rawFile
    const f = new VHDFile(rawContent.length, 523557791)
    await f.writeBuffer(rawContent)
    await f.writeFile(vhdFileName)
    await exec('qemu-img convert -fvpc -Oraw ' + vhdFileName + ' ' + reconvertedRawFilemane)
    return exec('qemu-img compare ' + vmdkFileName + ' ' + vhdFileName)
      .catch((error) => {
        console.error(error.stdout)
        console.error(error.stderr)
        console.error(vhdFileName, vmdkFileName, error.message)

        throw error
      })
  })

  it('can convert a random data file with VMDKDirectParser', async () => {
    let inputRawFileName = 'random-data.raw'
    let vmdkFileName = 'random-data.vmdk'
    let vhdFileName = 'from-vmdk-VMDKDirectParser.vhd'
    let reconvertedRawFilemane = 'from-vhd.raw'
    let reconvertedByVBoxRawFilemane = 'from-vhd-by-vbox.raw'
    let dataSize = computeGeometryForSize(8 * 1024 * 1024).actualSize
    await exec('rm -f ' + [inputRawFileName, vmdkFileName, vhdFileName, reconvertedRawFilemane, reconvertedByVBoxRawFilemane].join(' '))
    await exec('base64 /dev/urandom | head -c ' + dataSize + ' > ' + inputRawFileName)
    await exec('VBoxManage convertfromraw --format VMDK --variant Stream ' + inputRawFileName + ' ' + vmdkFileName)
    const pipe = (await convertFromVMDK(createReadStream(vmdkFileName))).pipe(createWriteStream(vhdFileName))
    await new Promise((resolve, reject) => {
      pipe.on('finish', resolve)
      pipe.on('error', reject)
    })
    await exec('qemu-img convert -fvmdk -Oraw ' + vmdkFileName + ' ' + reconvertedByVBoxRawFilemane)
    await exec('qemu-img convert -fvpc -Oraw ' + vhdFileName + ' ' + reconvertedRawFilemane)
    return exec('qemu-img compare ' + reconvertedByVBoxRawFilemane + ' ' + reconvertedRawFilemane)
      .catch((error) => {
        console.error(error.stdout)
        console.error(error.stderr)
        console.error(vhdFileName, vmdkFileName, error.message)

        throw error
      })
  })
})