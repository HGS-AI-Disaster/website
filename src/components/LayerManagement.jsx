import React from "react"
import { Input } from "./ui/input"
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
  MenubarSub,
  MenubarSubTrigger,
  MenubarSubContent,
} from "@/components/ui/menubar"

function LayerManagement() {
  return (
    <div className="bg-gray-300 p-8">
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="heading flex items-center">
          <div className="title flex-1">
            <div className="text-xl font-semibold">Layer Management</div>
            <div className="text-gray-400">Manage Layer (TIFF and GeoJSON)</div>
          </div>
          <div className="flex-1 flex justify-end gap-2">
            <Input
              type={"text"}
              placeHolder="Search"
              className={"w-2/4"}
            />
            <Menubar>
              <MenubarMenu>
                <MenubarTrigger>Filter</MenubarTrigger>
                <MenubarContent>
                  <MenubarItem>View All</MenubarItem>
                  <MenubarSeparator />
                  <MenubarSub>
                    <MenubarSubTrigger>Layer</MenubarSubTrigger>
                    <MenubarSubContent>
                      <MenubarItem>View all</MenubarItem>
                      <MenubarSeparator />
                      <MenubarItem>Cloud Layer</MenubarItem>
                      <MenubarItem>Typhoon Layer</MenubarItem>
                      <MenubarItem>Flood Layer</MenubarItem>
                    </MenubarSubContent>
                  </MenubarSub>
                  <MenubarSub>
                    <MenubarSubTrigger>Category</MenubarSubTrigger>
                    <MenubarSubContent>
                      <MenubarItem>View all</MenubarItem>
                      <MenubarSeparator />
                      <MenubarItem>Cloud Layer</MenubarItem>
                      <MenubarItem>Typhoon Layer</MenubarItem>
                      <MenubarItem>Flood Layer</MenubarItem>
                    </MenubarSubContent>
                  </MenubarSub>
                  <MenubarSub>
                    <MenubarSubTrigger>Layer date</MenubarSubTrigger>
                    <MenubarSubContent>
                      <MenubarItem>View all</MenubarItem>
                      <MenubarSeparator />
                      <MenubarItem>Cloud Layer</MenubarItem>
                      <MenubarItem>Typhoon Layer</MenubarItem>
                      <MenubarItem>Flood Layer</MenubarItem>
                    </MenubarSubContent>
                  </MenubarSub>
                  <MenubarSub>
                    <MenubarSubTrigger>Date uploaded</MenubarSubTrigger>
                    <MenubarSubContent>
                      <MenubarItem>View all</MenubarItem>
                      <MenubarSeparator />
                      <MenubarItem>Cloud Layer</MenubarItem>
                      <MenubarItem>Typhoon Layer</MenubarItem>
                      <MenubarItem>Flood Layer</MenubarItem>
                    </MenubarSubContent>
                  </MenubarSub>
                  <MenubarSub>
                    <MenubarSubTrigger>Source</MenubarSubTrigger>
                    <MenubarSubContent>
                      <MenubarItem>View all</MenubarItem>
                      <MenubarSeparator />
                      <MenubarItem>Cloud Layer</MenubarItem>
                      <MenubarItem>Typhoon Layer</MenubarItem>
                      <MenubarItem>Flood Layer</MenubarItem>
                    </MenubarSubContent>
                  </MenubarSub>
                  <MenubarSub>
                    <MenubarSubTrigger>Visibility</MenubarSubTrigger>
                    <MenubarSubContent>
                      <MenubarItem>View all</MenubarItem>
                      <MenubarSeparator />
                      <MenubarItem>Cloud Layer</MenubarItem>
                      <MenubarItem>Typhoon Layer</MenubarItem>
                      <MenubarItem>Flood Layer</MenubarItem>
                    </MenubarSubContent>
                  </MenubarSub>
                </MenubarContent>
              </MenubarMenu>
            </Menubar>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LayerManagement
